import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { register, login, getMe, verifyEmail, forgotPassword, resetPassword, verifyOtp, resendOtp, verifyPhone } from "./auth.controller";
import { authenticate } from "./auth.middleware";
import { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validation";

export const authRouter = Router();

// POST /api/v1/auth/register
authRouter.post("/register", validate(registerSchema), asyncHandler(register));

// POST /api/v1/auth/login
authRouter.post("/login", validate(loginSchema), asyncHandler(login));

// POST /api/v1/auth/verify-email
authRouter.post("/verify-email", validate(verifyEmailSchema), asyncHandler(verifyEmail));

// POST /api/v1/auth/verify-otp
authRouter.post("/verify-otp", asyncHandler(verifyOtp));

// POST /api/v1/auth/resend-otp
authRouter.post("/resend-otp", asyncHandler(resendOtp));

// POST /api/v1/auth/verify-phone
authRouter.post("/verify-phone", asyncHandler(verifyPhone));

// POST /api/v1/auth/forgot-password
authRouter.post("/forgot-password", validate(forgotPasswordSchema), asyncHandler(forgotPassword));

// POST /api/v1/auth/reset-password
authRouter.post("/reset-password", validate(resetPasswordSchema), asyncHandler(resetPassword));

// GET /api/v1/auth/me  (protected)
authRouter.get("/me", authenticate, asyncHandler(getMe));

