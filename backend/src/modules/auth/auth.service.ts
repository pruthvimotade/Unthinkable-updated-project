import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.config";
import { logger } from "../../config/logger.config";
import { ApiError } from "../../utils/ApiError";
import { authRepository } from "./auth.repository";
import type { AuthResponse, JwtPayload, UserProfile } from "./auth.types";
import type { LoginInput, RegisterInput } from "./auth.validation";
import { prisma } from "../../lib/prisma";
import { emailService } from "../../email/email.service";

const SALT_ROUNDS = 12;

// ─── Token helpers ──────────────────────────────────────────────────────────

function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Service ────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Internal helper to create a user (hashes password, checks duplicates).
   * Used by both public registration and admin provisioning.
   */
  async createUser(input: RegisterInput & { isVerified?: boolean; isPhoneVerified?: boolean }) {
    // Check for duplicate email
    const existingEmail = await authRepository.findByEmail(input.email);
    if (existingEmail) {
      throw ApiError.badRequest("Email is already registered");
    }

    // Check for duplicate phone (if provided)
    if (input.phone) {
      const existingPhone = await authRepository.findByPhone(input.phone);
      if (existingPhone) {
        throw ApiError.badRequest("Phone number is already registered");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await authRepository.createUser({
      email: input.email,
      name: input.name,
      phone: input.phone,
      password: hashedPassword,
      role: input.role,
      isVerified: input.isVerified,
      isPhoneVerified: input.isPhoneVerified,
    });

    logger.info({ userId: user.id, email: user.email, role: user.role }, "New user registered/provisioned");
    return user;
  },

  /**
   * Register a new account. Privileged roles must be provisioned in production.
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    if (input.role !== "CUSTOMER" && !env.ALLOW_PRIVILEGED_SELF_REGISTRATION) {
      throw ApiError.forbidden(
        "Admin and Delivery Agent accounts must be provisioned by an administrator",
      );
    }

    const user = await this.createUser(input);

    // Generate 6-digit OTP code
    const otp = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash: tokenHash,
        verificationExpiresAt: expiresAt,
      },
    });

    // Send OTP email (skip if configured)
    if (!env.SKIP_EMAIL_VERIFICATION) {
      await emailService.sendOtpEmail(user.email, user.name, otp);
      return {
        user,
      };
    } else {
      // Auto-verify in development when email verification is skipped
      const verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationTokenHash: null,
          verificationExpiresAt: null,
        },
      });
      // Generate token for auto-login
      const accessToken = signAccessToken({
        sub: verifiedUser.id,
        email: verifiedUser.email,
        role: verifiedUser.role,
        status: verifiedUser.status,
      });
      const { password: _, ...userProfile } = verifiedUser;
      return {
        user: userProfile,
        tokens: { accessToken },
      };
    }
  },

  /**
   * Verify account using 6-digit OTP code.
   */
  async verifyOtp(email: string, otp: string): Promise<void> {
    const tokenHash = hashToken(otp);
    const user = await prisma.user.findFirst({
      where: {
        email,
        verificationTokenHash: tokenHash,
        verificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest("Invalid or expired OTP code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokenHash: null,
        verificationExpiresAt: null,
      },
    });

    // Send Welcome Email asynchronously
    void emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      logger.error({ err, email: user.email }, "Failed to send welcome email upon verification");
    });

    logger.info({ userId: user.id, email: user.email }, "User verified email via OTP successfully");
  },

  /**
   * Resend verification OTP code (rate-limited to 1 request per 60s per email).
   */
  async resendOtp(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return silent success to avoid email enumeration
      logger.warn({ email }, "Resend OTP requested for non-existent email");
      return;
    }

    if (user.isVerified) {
      throw ApiError.badRequest("Email is already verified");
    }

    // Rate-limit: Check if existing OTP has been sent less than 60 seconds ago.
    if (user.verificationExpiresAt) {
      const sentAt = new Date(user.verificationExpiresAt.getTime() - 10 * 60 * 1000);
      const secondsSinceSent = (Date.now() - sentAt.getTime()) / 1000;
      if (secondsSinceSent < 60) {
        throw ApiError.badRequest(`Please wait ${Math.ceil(60 - secondsSinceSent)} seconds before requesting another code.`);
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash: tokenHash,
        verificationExpiresAt: expiresAt,
      },
    });

    await emailService.sendOtpEmail(user.email, user.name, otp);
    logger.info({ userId: user.id, email: user.email }, "Verification OTP resent successfully");
  },

  /**
   * Authenticate a user with email and password.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user with password
    const user = await authRepository.findByEmailWithPassword(input.email);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Check if account is locked out
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remainingMin = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
      throw ApiError.forbidden(`Too many failed attempts. Account locked. Try again in ${remainingMin} minutes.`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
        throw ApiError.forbidden("Too many failed attempts. Account locked for 15 minutes.");
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts },
        });
        throw ApiError.unauthorized("Invalid email or password");
      }
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is not active. Please contact support.");
    }
    // Skip email verification check in development if configured
    if (!user.isVerified && !env.SKIP_EMAIL_VERIFICATION) {
      throw ApiError.forbidden("Please verify your email first.");
    }

    // Reset lockout counters on success
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    logger.info({ userId: user.id, email: user.email }, "User logged in");

    // Generate token
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // Return user without password
    const { password: _, ...userProfile } = user;

    return {
      user: userProfile,
      tokens: { accessToken },
    };
  },

  /**
   * Verify account using verification token.
   */
  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        verificationTokenHash: tokenHash,
        verificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest("Invalid or expired verification link");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokenHash: null,
        verificationExpiresAt: null,
      },
    });

    logger.info({ userId: user.id, email: user.email }, "User verified email successfully");
  },

  /**
   * Request password reset link.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return silent success to avoid email enumeration
      logger.warn({ email }, "Forgot password requested for non-existent email");
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    try {
      await emailService.sendResetPasswordEmail(user.email, user.name, token);
    } catch (err) {
      logger.error({ err, email: user.email }, "Failed to send reset password email, but ignoring to prevent 500");
    }
  },

  /**
   * Reset user password using token.
   */
  async resetPassword(token: string, newPasswordStr: string): Promise<void> {
    const tokenHash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest("Invalid or expired reset link");
    }

    const hashedPassword = await bcrypt.hash(newPasswordStr, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });

    logger.info({ userId: user.id, email: user.email }, "User password reset successfully");
  },

  /**
   * Get current user profile by ID.
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  },

  /**
   * Verify phone number via Firebase ID token.
   */
  async verifyPhone(email: string, phone: string, firebaseToken: string): Promise<void> {
    const { firebaseEnabled } = await import("../../config/firebase.config.js");
    
    if (!firebaseEnabled) {
      throw ApiError.badRequest("Firebase phone verification is unavailable");
    }

    const { getAuth } = await import("firebase-admin/auth");
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(firebaseToken);
    } catch (err: any) {
      throw ApiError.badRequest(`Invalid Firebase verification token: ${err.message}`);
    }

    const firebasePhone = decodedToken.phone_number;
    if (!firebasePhone) {
      throw ApiError.badRequest("Firebase token does not contain a verified phone number");
    }

    const cleanTokenPhone = firebasePhone.replace(/\D/g, "");
    const cleanInputPhone = phone.replace(/\D/g, "");

    if (cleanTokenPhone !== cleanInputPhone) {
      throw ApiError.badRequest("Firebase phone number does not match submitted phone number");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        isPhoneVerified: true,
      },
    });

    logger.info({ userId: user.id, phone }, "User phone verified successfully via Firebase");
  },
};
