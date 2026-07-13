import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  registerSchema,
  type RegisterFormData,
} from "../schemas/authSchemas";
import { authApi } from "../api/authApi";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Loader2, MailCheck, Phone } from "lucide-react";
import { AxiosError } from "axios";
import { useToast } from "../../../contexts/ToastContext";
import { auth, firebaseEnabled } from "../../../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export function RegisterForm() {
  const { success, error } = useToast();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Phone Step States
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data, variables) => {
      // If registration returns tokens, auto-login (development mode with email verification skipped)
      if (data.data.tokens?.accessToken) {
        login(data.data.tokens.accessToken, data.data.user);
        success("Registration successful! You are now logged in.");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
        return;
      }

      // Otherwise, show OTP verification screen
      setRegisteredEmail(variables.email);
      setRegistered(true);
      setCountdown(60);
      setCanResend(false);
      success("Registration successful! Verification code sent to email.");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setErrorMsg(
        err.response?.data?.message || "An error occurred during registration."
      );
    },
  });

  const sendFirebasePhoneOtp = async () => {
    if (!auth || !firebaseEnabled || !registeredPhone) return;
    setSendingPhoneOtp(true);
    setErrorMsg(null);
    try {
      let recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        recaptchaContainer = document.createElement("div");
        recaptchaContainer.id = "recaptcha-container";
        document.body.appendChild(recaptchaContainer);
      }

      // Invisible reCAPTCHA verifier
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });

      const confirmation = await signInWithPhoneNumber(auth, registeredPhone, verifier);
      setConfirmationResult(confirmation);
      success("Phone verification code sent successfully!");
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      error("Failed to send phone code: " + (err.message || "Unknown error"));
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp({ email: registeredEmail, otp: otpCode }),
    onSuccess: () => {
      success("Email verified successfully!");
      if (registeredPhone && firebaseEnabled && auth) {
        setShowPhoneVerification(true);
        setTimeout(() => {
          sendFirebasePhoneOtp();
        }, 100);
      } else {
        success("Registration completed. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      error(err.response?.data?.message || "Invalid or expired verification code.");
    }
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async () => {
      if (!confirmationResult) throw new Error("No phone code sent");
      const credential = await confirmationResult.confirm(phoneOtp);
      const firebaseToken = await credential.user.getIdToken();
      return authApi.verifyPhone({
        email: registeredEmail,
        phone: registeredPhone,
        firebaseToken,
      });
    },
    onSuccess: () => {
      success("Phone number verified successfully! Account is fully active.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    },
    onError: (err: any) => {
      console.error("Phone Verification Error:", err);
      error(err.response?.data?.message || err.message || "Failed to verify phone number.");
    }
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(registeredEmail),
    onSuccess: () => {
      success("Verification code resent to your email.");
      setCountdown(60);
      setCanResend(false);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      error(err.response?.data?.message || "Failed to resend code.");
    }
  });

  const handleSkipPhone = () => {
    success("Phone verification skipped. Redirecting to login...");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  useEffect(() => {
    if (!registered || countdown <= 0) {
      if (countdown <= 0) setCanResend(true);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [registered, countdown]);

  const onSubmit = (data: RegisterFormData) => {
    setErrorMsg(null);
    const { confirmPassword, ...payload } = data;
    void confirmPassword;
    const rawPhone = data.phone?.replace(/\D/g, "");
    const formattedPhone = rawPhone ? `+91${rawPhone}` : undefined;
    if (formattedPhone) {
      setRegisteredPhone(formattedPhone);
    }
    mutation.mutate({
      ...payload,
      phone: formattedPhone,
      role: "CUSTOMER",
    });
  };

  if (showPhoneVerification) {
    return (
      <div className="space-y-6 p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl animate-fade-in flex flex-col items-center">
        <div className="bg-blue-500/10 p-3.5 rounded-full text-blue-400">
          <Phone className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-white">Verify Phone Number</h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Enter the 6-digit OTP code sent to <span className="font-semibold text-slate-200">{registeredPhone}</span>.
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phoneOtp" className="text-slate-300 font-medium text-xs">
              SMS Verification Code
            </Label>
            <Input
              id="phoneOtp"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
              className="bg-white/[0.02] border-white/10 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-slate-600 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-12"
            />
          </div>

          <Button
            onClick={() => verifyPhoneMutation.mutate()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20"
            disabled={verifyPhoneMutation.isPending || phoneOtp.length !== 6 || sendingPhoneOtp}
          >
            {verifyPhoneMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Phone OTP
          </Button>

          <Button
            onClick={handleSkipPhone}
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
          >
            Skip for Now
          </Button>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="space-y-6 p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl animate-fade-in flex flex-col items-center">
        <div className="bg-blue-500/10 p-3.5 rounded-full text-blue-400">
          <MailCheck className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-white">Enter Verification Code</h3>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            We have sent a 6-digit code to <span className="font-semibold text-slate-200">{registeredEmail}</span>.
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-slate-300 font-medium text-xs">
              Verification Code
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="bg-white/[0.02] border-white/10 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder-slate-600 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-12"
            />
          </div>

          <Button
            onClick={() => verifyMutation.mutate()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20"
            disabled={verifyMutation.isPending || otpCode.length !== 6}
          >
            {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Activate
          </Button>

          <div className="text-center text-xs">
            {canResend ? (
              <button
                onClick={() => resendMutation.mutate()}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? "Resending..." : "Resend code"}
              </button>
            ) : (
              <span className="text-slate-500">Resend code in {countdown}s</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-red-200 bg-red-950/40 border border-red-500/20 rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-slate-300 font-medium text-xs">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="John Doe"
          autoComplete="name"
          className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-10"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-400 font-medium">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-300 font-medium text-xs">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-10"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-slate-300 font-medium text-xs">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-10"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-slate-300 font-medium text-xs">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-10"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-400 font-medium">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-slate-300 font-medium text-xs">
          Phone Number (Optional)
        </Label>
        <div className="flex gap-2">
          <span className="flex items-center justify-center bg-white/[0.02] border border-white/10 text-slate-400 rounded-xl px-3 text-sm h-10 select-none font-medium">+91</span>
          <Input
            id="phone"
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            className="flex-1 bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-10"
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-red-400 font-medium">{errors.phone.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 mt-2" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Create Account
      </Button>
    </form>
  );
}
