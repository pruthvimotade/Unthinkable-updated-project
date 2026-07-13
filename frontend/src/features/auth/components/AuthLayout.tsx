import React from "react";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-between selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* Premium background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Header Branding */}
      <header className="py-6 px-8 relative z-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Last Mile Delivery
            </span>
          </div>
        </Link>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/40 rounded-3xl p-8 space-y-6 hover:border-white/10 transition-all duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-400 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-6 px-8 relative z-10 text-center text-xs text-slate-500 font-medium flex flex-col sm:flex-row justify-between items-center gap-2 max-w-7xl mx-auto w-full">
        <div>
          &copy; {currentYear} Last Mile Enterprise. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
            Build Version: 1.2.0
          </span>
        </div>
      </footer>
    </div>
  );
}
