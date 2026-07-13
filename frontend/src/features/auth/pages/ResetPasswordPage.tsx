import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Loader2, CheckCircle2, Check, AlertCircle } from "lucide-react";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Live password validation checks
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Reset token is missing from URL.");
      return;
    }
    if (!isPasswordValid) return;
    if (!passwordsMatch) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await authApi.resetPassword({ token, password });
      setStatus("success");
      setMessage(res.message || "Password has been successfully updated.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <AuthLayout title="Password Reset Successful" subtitle="You can now sign in with your new credentials">
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Password Updated</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          </div>
          <Link to="/" className="w-full mt-2">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl">
              Go to Login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Establish a secure password for your account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {status === "error" && (
          <div className="p-3 text-xs font-semibold text-red-200 bg-red-950/40 border border-red-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300 font-medium text-xs">
            New Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
          />
        </div>

        {/* Live Validation Panel */}
        {password.length > 0 && (
          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Password Strength Requirements
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${checks.minLength ? "text-emerald-400" : "text-slate-500"}`}>
                <Check className={`w-3.5 h-3.5 ${checks.minLength ? "opacity-100" : "opacity-30"}`} />
                <span>Min 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.uppercase ? "text-emerald-400" : "text-slate-500"}`}>
                <Check className={`w-3.5 h-3.5 ${checks.uppercase ? "opacity-100" : "opacity-30"}`} />
                <span>Uppercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.lowercase ? "text-emerald-400" : "text-slate-500"}`}>
                <Check className={`w-3.5 h-3.5 ${checks.lowercase ? "opacity-100" : "opacity-30"}`} />
                <span>Lowercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.number ? "text-emerald-400" : "text-slate-500"}`}>
                <Check className={`w-3.5 h-3.5 ${checks.number ? "opacity-100" : "opacity-30"}`} />
                <span>Numeric digit</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.special ? "text-emerald-400" : "text-slate-500"}`}>
                <Check className={`w-3.5 h-3.5 ${checks.special ? "opacity-100" : "opacity-30"}`} />
                <span>Special character</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-300 font-medium text-xs">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-400 font-medium mt-1">Passwords do not match.</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20" 
          disabled={loading || !isPasswordValid || !passwordsMatch}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
