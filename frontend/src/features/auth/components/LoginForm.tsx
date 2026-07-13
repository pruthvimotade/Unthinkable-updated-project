import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  dashboardPathByRole,
  loginSchema,
  type LoginFormData,
} from "../schemas/authSchemas";
import { authApi } from "../api/authApi";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.data.tokens?.accessToken || "", data.data.user);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      navigate(dashboardPathByRole[data.data.user.role], { replace: true });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setErrorMsg(
        error.response?.data?.message || "An error occurred during login."
      );
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-red-200 bg-red-950/40 border border-red-500/20 rounded-xl animate-shake">
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
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-400 font-medium mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-slate-300 font-medium text-xs">
            Password
          </Label>
          <Link 
            to="/forgot-password" 
            className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="current-password"
          className="bg-white/[0.02] border-white/10 text-white placeholder-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-11"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-red-400 font-medium mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Sign In
      </Button>
    </form>
  );
}
