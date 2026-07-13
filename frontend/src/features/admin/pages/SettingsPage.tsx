export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
      <div className="border rounded-md p-6 bg-card text-card-foreground">
        <p className="text-muted-foreground mb-4">
          Global settings for Volumetric Divisor, Base COD Surcharge, and system defaults.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Volumetric Weight Divisor</label>
            <input 
              type="number" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={5000} 
              disabled 
            />
            <p className="text-xs text-muted-foreground">Standard divisor used in L×B×H ÷ Divisor calculation.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Default COD Surcharge (Base)</label>
            <input 
              type="number" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={50} 
              disabled 
            />
            <p className="text-xs text-muted-foreground">Fallback COD surcharge when rate card does not specify one.</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex justify-end">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" disabled>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
