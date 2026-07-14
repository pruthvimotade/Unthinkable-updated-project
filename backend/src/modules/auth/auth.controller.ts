import type { Request, Response } from "express";
import { authService } from "./auth.service";
import type { LoginInput, RegisterInput, VerifyEmailInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.validation";
import { logger } from "../../config/logger.config";

/**
 * POST /api/v1/auth/register
 *
 * Register a new customer account.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: result,
  });
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticate with email and password.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  logger.info({ email: input.email, body: req.body }, "[DIAGNOSTIC] Controller: Login request received");
  
  try {
    const result = await authService.login(input);
    logger.info({ email: input.email, userId: result.user?.id, role: result.user?.role }, "[DIAGNOSTIC] Controller: Login successful, sending response");

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    logger.error({ email: input.email, error }, "[DIAGNOSTIC] Controller: Login failed with error");
    throw error;
  }
}

/**
 * GET /api/v1/auth/me
 *
 * Get the currently authenticated user's profile.
 * Requires: authenticate middleware.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const profile = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: profile,
  });
}

/**
 * POST /api/v1/auth/verify-email
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const input = req.body as VerifyEmailInput;
  await authService.verifyEmail(input.token);

  res.status(200).json({
    success: true,
    message: "Email verified successfully. You can now log in.",
  });
}

/**
 * POST /api/v1/auth/verify-otp
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body as { email: string; otp: string };
  await authService.verifyOtp(email, otp);

  res.status(200).json({
    success: true,
    message: "Email verified successfully. You can now log in.",
  });
}

/**
 * POST /api/v1/auth/resend-otp
 */
export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  await authService.resendOtp(email);

  res.status(200).json({
    success: true,
    message: "Verification OTP resent successfully.",
  });
}

/**
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input = req.body as ForgotPasswordInput;
  await authService.requestPasswordReset(input.email);

  res.status(200).json({
    success: true,
    message: "If an account exists, a reset link has been sent.",
  });
}

/**
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = req.body as ResetPasswordInput;
  await authService.resetPassword(input.token, input.password);

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
}

/**
 * POST /api/v1/auth/verify-phone
 */
export async function verifyPhone(req: Request, res: Response): Promise<void> {
  const { email, phone, firebaseToken } = req.body as { email: string; phone: string; firebaseToken: string };
  await authService.verifyPhone(email, phone, firebaseToken);

  res.status(200).json({
    success: true,
    message: "Phone number verified and updated successfully.",
  });
}

