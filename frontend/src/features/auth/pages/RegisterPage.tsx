import { Link } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";
import { AuthLayout } from "../components/AuthLayout";

export function RegisterPage() {
  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Register as a logistics customer to dispatch orders"
    >
      <RegisterForm />
      <div className="mt-4 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
