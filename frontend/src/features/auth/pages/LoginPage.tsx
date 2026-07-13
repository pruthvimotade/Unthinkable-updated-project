import { Link } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { AuthLayout } from "../components/AuthLayout";

export function LoginPage() {
  return (
    <AuthLayout
      title="Sign In"
      subtitle="Sign in with your enterprise credentials"
    >
      <LoginForm />

      <div className="text-center text-sm text-slate-400 mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
}
