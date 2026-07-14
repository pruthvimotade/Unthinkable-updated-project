export function SettingsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">Global settings for Volumetric Divisor, Base COD Surcharge, and system defaults.</p>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Volumetric Weight Divisor</label>
            <input 
              type="number" 
              className="flex h-11 w-full rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2 text-sm text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={5000} 
              disabled 
            />
            <p className="text-xs text-zinc-500 font-medium">Standard divisor used in L×B×H ÷ Divisor calculation.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Default COD Surcharge (Base)</label>
            <input 
              type="number" 
              className="flex h-11 w-full rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2 text-sm text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={50} 
              disabled 
            />
            <p className="text-xs text-zinc-500 font-medium">Fallback COD surcharge when rate card does not specify one.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
          <button className="inline-flex items-center justify-center rounded-xl text-xs font-bold bg-zinc-800 text-zinc-400 border border-white/5 px-4 h-11 disabled:cursor-not-allowed" disabled>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

