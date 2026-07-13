import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    authApi.verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Invalid or expired verification link.");
      });
  }, [token]);

  return (
    <AuthLayout title="Account Verification">
      <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Validating Token</h3>
              <p className="text-sm text-slate-400">Verifying credentials against central registries...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-emerald-400">Email Verified</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
            </div>
            <Link to="/login/customer" className="w-full mt-2">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl">
                Go to Customer Login
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-red-400">Verification Failed</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
            </div>
            <Link to="/" className="w-full mt-2">
              <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-11 rounded-xl">
                Return to Home
              </Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
