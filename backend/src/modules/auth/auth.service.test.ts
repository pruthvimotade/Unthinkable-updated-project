import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./auth.service";
import { authRepository } from "./auth.repository";
import { emailService } from "../../email/email.service";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

vi.mock("./auth.repository", () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findByPhone: vi.fn(),
    createUser: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../../email/email.service", () => ({
  emailService: {
    sendOtpEmail: vi.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService OTP flows", () => {
  describe("register", () => {
    it("generates a 6-digit OTP, updates database, and sends email", async () => {
      vi.mocked(authRepository.findByEmail).mockResolvedValueOnce(null);
      vi.mocked(authRepository.createUser).mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        phone: null,
        role: "CUSTOMER",
        status: "ACTIVE",
        isVerified: false,
        isPhoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const result = await authService.register({
        email: "test@example.com",
        password: "Password@12345",
        name: "Test User",
        role: "CUSTOMER",
      });

      expect(authRepository.createUser).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({
            verificationTokenHash: expect.any(String),
            verificationExpiresAt: expect.any(Date),
          }),
        })
      );
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Test User",
        expect.stringMatching(/^\d{6}$/)
      );
      expect(result.user.id).toBe("user-1");
    });
  });

  describe("verifyOtp", () => {
    it("successfully verifies user if valid OTP is submitted before expiration", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        verificationTokenHash: "some-hash",
        verificationExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      await authService.verifyOtp("test@example.com", "123456");

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          isVerified: true,
          verificationTokenHash: null,
          verificationExpiresAt: null,
        },
      });
    });

    it("throws ApiError if code is invalid/expired", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);

      await expect(
        authService.verifyOtp("test@example.com", "123456")
      ).rejects.toThrow(ApiError);
    });
  });

  describe("resendOtp", () => {
    it("resends OTP after rate limit duration has passed", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        isVerified: false,
        verificationExpiresAt: new Date(Date.now() - 2 * 60 * 1000),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      await authService.resendOtp("test@example.com");

      expect(prisma.user.update).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalled();
    });

    it("throws ApiError if resending within 60 seconds", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        isVerified: false,
        verificationExpiresAt: new Date(Date.now() + 9.5 * 60 * 1000),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any);

      await expect(
        authService.resendOtp("test@example.com")
      ).rejects.toThrow(ApiError);
    });
  });
});
