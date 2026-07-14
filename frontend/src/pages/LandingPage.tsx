import { Link } from "react-router-dom";
import { Package, ArrowRight, ShieldCheck, Map, Bell, Globe, Zap, AlertTriangle, Activity } from "lucide-react";
import { useState, useEffect } from "react";

export function LandingPage() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<"customer" | "agent" | "admin">("customer");
  const [counter, setCounter] = useState(1483);
  const [activeDeliveries, setActiveDeliveries] = useState(24);

  // Live telemetry counters simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 2) + 1);
      setActiveDeliveries(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(10, Math.min(50, prev + delta));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col font-sans relative overflow-hidden">
      {/* Cinematic grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Floating glowing light sources */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] pulse-glow-bg pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-emerald-500/5 blur-[150px] pulse-glow-bg pointer-events-none" />

      {/* Premium Header */}
      <header className="border-b border-white/5 bg-[#030303]/60 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Last Mile
              </span>
              <span className="text-[10px] block text-zinc-500 font-extrabold tracking-wider uppercase leading-none mt-0.5">
                Logistics OS
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400 tracking-wider uppercase">
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#features" className="hover:text-white transition-colors">Telemetry Features</a>
            <a href="#metrics" className="hover:text-white transition-colors">Live Operations</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-400 font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              BUILD v1.2.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-8 py-16 md:py-24 relative z-10 w-full">
        
        {/* Apple-style Hero section */}
        <div className="text-center max-w-4xl mx-auto mb-24 md:mb-32">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Empowering DHL, FedEx & Uber Freight
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent leading-none">
            Automate Your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Logistics Pipeline
            </span>
          </h1>
          <p className="text-base md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-12">
            Calculate volumetric pricing, optimize routes with progressive radius expansion, and update drivers in real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo" className="w-full sm:w-auto py-4 px-8 bg-white text-black font-bold rounded-xl transition-all duration-300 hover:bg-zinc-200 text-sm shadow-xl shadow-white/5">
              Launch Enterprise Demo
            </a>
            <Link to="/register" className="w-full sm:w-auto py-4 px-8 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/5 text-center transition-all duration-300 text-sm">
              Register Customer Portal
            </Link>
          </div>
        </div>

        {/* Live Metrics Showcase */}
        <section id="metrics" className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 md:mb-32">
          <div className="glass-card rounded-2xl p-6 glow-primary">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2">Total Deliveries</span>
            <div className="text-3xl font-black font-mono text-white tracking-tight">{counter}</div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2">Active Drivers</span>
            <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">{activeDeliveries}</div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2">Routing Precision</span>
            <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">99.8%</div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-2">API Response</span>
            <div className="text-3xl font-black font-mono text-purple-400 tracking-tight">42ms</div>
          </div>
        </section>

        {/* Interactive Logistics Control Demo */}
        <section id="demo" className="glass-panel rounded-3xl p-8 md:p-12 mb-24 md:mb-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Globe className="w-3.5 h-3.5 animate-spin" /> Live Interactive Matrix
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Multi-Portal Sandbox
              </h2>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                Experience the application from three structural roles. Toggle each perspective to preview data-driven operations.
              </p>
              
              {/* Role Toggle Selector */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-950 border border-white/5 rounded-2xl w-fit">
                <button 
                  onClick={() => setActiveTab("customer")}
                  className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all ${activeTab === "customer" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
                >
                  Customer View
                </button>
                <button 
                  onClick={() => setActiveTab("agent")}
                  className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all ${activeTab === "agent" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
                >
                  Agent Workspace
                </button>
                <button 
                  onClick={() => setActiveTab("admin")}
                  className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all ${activeTab === "admin" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
                >
                  Control Room
                </button>
              </div>
            </div>

            {/* Simulated UI Window */}
            <div className="w-full lg:w-[480px] bg-zinc-950 border border-white/5 shadow-2xl rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Simulated Workspace</span>
              </div>

              {activeTab === "customer" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">Order #ORD-20260714-8F3C</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">Pickup: Powai | Drop: Andheri</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">In Transit</span>
                  </div>
                  <div className="h-24 bg-white/[0.01] border border-dashed border-white/5 rounded-xl flex items-center justify-center">
                    <Link to="/login/customer" className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1">
                      Enter Customer Dashboard <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "agent" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2">Assigned Shipments</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                        <span className="text-zinc-400">Order #ORD-501A</span>
                        <span className="text-yellow-400">Pending OTP</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Order #ORD-839F</span>
                        <span className="text-emerald-400 font-bold">Arriving</span>
                      </div>
                    </div>
                  </div>
                  <Link to="/login/agent" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center block text-xs font-bold transition-all shadow-md">
                    Access Agent Dashboard
                  </Link>
                </div>
              )}

              {activeTab === "admin" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Saturated Zones</div>
                      <div className="text-sm font-black text-red-400 mt-1">Z-MUM</div>
                    </div>
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Unassigned Orders</div>
                      <div className="text-sm font-black text-yellow-400 mt-1">0 Active</div>
                    </div>
                  </div>
                  <Link to="/login/admin" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-white/10 text-center block text-xs font-bold transition-all">
                    Launch Admin Console
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="border-t border-white/5 pt-20 mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Logistics Assignment Engine
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-indigo-400 bg-indigo-500/10 p-3 rounded-xl w-fit mb-6">
                <Map className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Zone Detection</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automatic service zone identification based on pickup and drop coordinates for accurate rate calculation.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-emerald-400 bg-emerald-500/10 p-3 rounded-xl w-fit mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Auto Assignment</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Intelligent agent scoring algorithm assigns shipments based on capacity, proximity, and historical performance.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-purple-400 bg-purple-500/10 p-3 rounded-xl w-fit mb-6">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Tracking Timeline</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Real-time shipment status updates with detailed event logging from assignment to final delivery.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-amber-400 bg-amber-500/10 p-3 rounded-xl w-fit mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Volumetric Weight</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dimensional weight calculation for accurate pricing based on package size and weight slabs.
              </p>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-4 gap-8 mt-8">
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-blue-400 bg-blue-500/10 p-3 rounded-xl w-fit mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Rate Calculation</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dynamic pricing engine with zone-based rate cards, weight slabs, and distance multipliers.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-red-400 bg-red-500/10 p-3 rounded-xl w-fit mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Failed Delivery Handling</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automated retry logic and manual intervention workflows for failed delivery attempts.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-teal-400 bg-teal-500/10 p-3 rounded-xl w-fit mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Analytics Dashboard</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Comprehensive operations analytics with delivery rates, agent utilization, and revenue tracking.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 hover:bg-white/[0.02] transition-all">
              <div className="text-pink-400 bg-pink-500/10 p-3 rounded-xl w-fit mb-6">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white mb-2 text-lg">Notifications</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Real-time alerts for assignment changes, status updates, and delivery confirmations.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#030303] py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500 font-medium">
          <div>
            &copy; {currentYear} Last Mile Enterprise. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              BUILD VERSION 1.2.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

