import React from "react";
import { Package, Truck, Users, MapPin, Activity, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col lg:flex-row selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* Premium background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Left Panel - Operational Metrics */}
      <div className="lg:w-1/2 bg-zinc-950/50 backdrop-blur-xl border-r border-white/5 p-8 lg:p-12 flex flex-col justify-between relative z-10">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Last Mile Enterprise
              </span>
            </div>
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent mb-2">
              Enterprise Logistics Platform
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              Real-time shipment tracking, automated agent assignment, and intelligent route optimization.
            </p>
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Orders Delivered</span>
              </div>
              <div className="text-2xl font-black font-mono text-white tracking-tight">12,847</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Agents Online</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">342</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Service Zones</span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">18</div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Today's Shipments</span>
              </div>
              <div className="text-2xl font-black font-mono text-purple-400 tracking-tight">856</div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-emerald-400">System Operational</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">99.8% uptime • All services running</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-zinc-500 font-medium">
          &copy; {currentYear} Last Mile Enterprise. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Authentication Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 relative z-10">
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
      </div>
    </div>
  );
}
