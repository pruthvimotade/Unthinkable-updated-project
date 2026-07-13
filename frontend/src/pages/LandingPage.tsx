import { Link } from "react-router-dom";
import { Package, Truck, ShieldAlert, ArrowRight, ShieldCheck, Map, Clock, Bell } from "lucide-react";

export function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans selection:bg-primary/30 selection:text-white relative overflow-hidden">
      {/* Background gradients for premium glassmorphism feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      {/* Header / Navigation */}
      <header className="border-b border-white/5 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Last Mile
              </span>
              <span className="text-xs block text-slate-500 font-semibold tracking-wider uppercase leading-none">
                Enterprise Logistics
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#portals" className="hover:text-white transition-colors">Portals</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#performance" className="hover:text-white transition-colors">System Metrics</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono hidden sm:inline bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              v1.2.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10 w-full">
        {/* Hero Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Next-Gen Last Mile Operations
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Enterprise Logistics <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Platform
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed">
            Optimize driver assignment, track packages in real-time, and automate transactional dispatch pipelines with micro-accuracy.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <section id="portals" className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* Customer Portal */}
          <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 hover:bg-white/[0.04] hover:border-blue-500/20 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
            <div className="bg-blue-500/10 p-3.5 rounded-2xl w-fit mb-6 text-blue-400">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Customer Portal</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Create logistics orders, check real-time pricing quotes, and track deliveries via the interactive timeline map.
            </p>
            <div className="mt-auto space-y-3 w-full">
              <Link
                to="/login/customer"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-center block transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group/btn text-sm"
              >
                Customer Login
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl text-center block transition-all duration-300 text-sm"
              >
                Create Customer Account
              </Link>
            </div>
          </div>

          {/* Delivery Partner */}
          <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div className="bg-emerald-500/10 p-3.5 rounded-2xl w-fit mb-6 text-emerald-400">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Delivery Partner</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Receive active assignments, process package collections, and update delivery milestones straight from the road.
            </p>
            <div className="mt-auto w-full">
              <Link
                to="/login/agent"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-center block transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group/btn text-sm"
              >
                Delivery Agent Login
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Administration */}
          <div className="group border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
            <div className="bg-indigo-500/10 p-3.5 rounded-2xl w-fit mb-6 text-indigo-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Administration</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Manage system configurations, adjust rate cards, monitor agent workloads, and override delivery states.
            </p>
            <div className="mt-auto w-full">
              <Link
                to="/login/admin"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-center block transition-all duration-300 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group/btn text-sm"
              >
                Admin Login
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-white/5 pt-20 mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-16 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Automated Operations Hub
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="text-blue-400 bg-blue-500/10 p-2.5 rounded-lg w-fit">
                <Map className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white">Interactive Routing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates and plots exact driving parameters using coordinates for accurate maps representation.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white">Intelligent Scoring</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recommends optimal local drivers based on capacity, distance, and historical acceptances.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-indigo-400 bg-indigo-500/10 p-2.5 rounded-lg w-fit">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white">Real-Time Sync</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Updates clients, partners, and administrators instantly through database transition triggers.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-amber-400 bg-amber-500/10 p-2.5 rounded-lg w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white">Slab-Based Pricing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic, weight-categorized pricing engine connected cleanly with geographical matrices.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070A0F] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div>
            &copy; {currentYear} Last Mile Enterprise. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              Build Version: 1.2.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
