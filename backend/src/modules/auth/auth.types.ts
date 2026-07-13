import type { UserRole, UserStatus } from "@prisma/client";

// ─── JWT ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

// ─── Service Return Types ───────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens?: AuthTokens;
}

// ─── User Shapes ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
