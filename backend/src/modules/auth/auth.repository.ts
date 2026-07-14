import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { RegisterInput } from "./auth.validation";
import { logger } from "../../config/logger.config";

// ─── Select sets ────────────────────────────────────────────────────────────

/**
 * Public user fields returned to clients — never includes password.
 */
const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  role: true,
  status: true,
  isVerified: true,
  isPhoneVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Fields needed internally for authentication (includes password hash).
 */
const authUserSelect = {
  ...publicUserSelect,
  password: true,
  failedLoginAttempts: true,
  lockoutUntil: true,
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export type PublicUser = Pick<User, keyof typeof publicUserSelect>;
export type AuthUser = Pick<User, keyof typeof authUserSelect>;

// ─── Repository ─────────────────────────────────────────────────────────────

export const authRepository = {
  /**
   * Find a user by email, including the password hash for credential verification.
   */
  async findByEmailWithPassword(email: string): Promise<AuthUser | null> {
    logger.info({ email }, "[DIAGNOSTIC] Repository: Querying user by email with password");
    const user = await prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
    logger.info({ email, userFound: !!user, userId: user?.id, role: user?.role }, "[DIAGNOSTIC] Repository: User query result");
    return user;
  },

  /**
   * Find a user by email (public fields only).
   */
  async findByEmail(email: string): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  },

  /**
   * Find a user by ID (public fields only).
   */
  async findById(id: string): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  },

  /**
   * Check whether a phone number is already taken.
   */
  async findByPhone(phone: string): Promise<PublicUser | null> {
    return prisma.user.findUnique({
      where: { phone },
      select: publicUserSelect,
    });
  },

  /**
   * Create a user and initialize an AgentStatus row for delivery agents.
   */
  async createUser(
    data: Omit<RegisterInput, "password"> & { password: string; isVerified?: boolean; isPhoneVerified?: boolean },
  ): Promise<PublicUser> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone ?? null,
        password: data.password,
        role: data.role,
        status: "ACTIVE",
        isVerified: data.isVerified ?? false,
        isPhoneVerified: data.isPhoneVerified ?? false,
        agentStatus: data.role === "AGENT" ? { create: {} } : undefined,
      },
      select: publicUserSelect,
    });
  },
};
