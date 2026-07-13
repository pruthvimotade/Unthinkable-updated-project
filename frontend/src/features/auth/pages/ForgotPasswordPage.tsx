import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Loader2, MailCheck } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Reset Password link sent" subtitle="Check your email client">
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-6">
          <div className="bg-blue-500/10 p-3.5 rounded-full text-blue-400 animate-pulse">
            <MailCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Reset Link Dispatched</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              If an account with email <strong>{email}</strong> exists, a password reset link has been dispatched to it.
            </p>
          </div>
          <Link to="/" className="w-full mt-2">
            <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-11 rounded-xl">
              Return to Home
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Request a password recovery link">
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 text-xs font-semibold text-red-200 bg-red-950/40 border border-red-500/20 rounded-xl">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300 font-medium text-xs">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20" 
          disabled={loading || !email}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Request Reset Link
        </Button>

        <div className="text-center text-sm text-slate-400 mt-2">
          Remembered password?{" "}
          <Link to="/" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
