import { useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Package, ScanBarcode, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

// Mocking Warehouse Data
const MOCK_INVENTORY = [
  { id: "PKG-1001", orderNumber: "ORD-20261011-A1B2", status: "STOWED", zone: "Zone A" },
  { id: "PKG-1002", orderNumber: "ORD-20261011-C3D4", status: "STOWED", zone: "Zone B" },
  { id: "PKG-1003", orderNumber: "ORD-20261011-E5F6", status: "PENDING_DISPATCH", zone: "Zone C" },
];

export function WarehouseDashboardPage() {
  const { success, error } = useToast();
  const [scanInput, setScanInput] = useState("");
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setIsScanning(true);
    
    // Simulate API delay
    setTimeout(() => {
      const found = inventory.find(p => p.id === scanInput.trim() || p.orderNumber === scanInput.trim());
      
      if (found) {
        if (found.status === "PENDING_DISPATCH") {
          success(`Package ${found.id} dispatched successfully!`);
          setInventory(prev => prev.filter(p => p.id !== found.id));
        } else {
          success(`Package ${found.id} marked ready for dispatch.`);
          setInventory(prev => prev.map(p => p.id === found.id ? { ...p, status: "PENDING_DISPATCH" } : p));
        }
      } else {
        error(`Package ${scanInput} not found in inventory.`);
      }

      setScanInput("");
      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Operations</h1>
        <p className="text-muted-foreground">Manage incoming packages, stowage, and dispatch scanning.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stowed Packages</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(p => p.status === "STOWED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dispatch</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(p => p.status === "PENDING_DISPATCH").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scan Station</CardTitle>
            <ScanBarcode className="h-4 w-4" />
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleScan} className="flex gap-2">
              <Input
                placeholder="Scan Barcode..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="bg-primary-foreground text-foreground"
                autoFocus
              />
              <Button type="submit" variant="secondary" disabled={isScanning}>
                {isScanning ? "..." : "Scan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Current Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Inventory is empty.
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <h3 className="font-semibold text-lg">{pkg.id}</h3>
                    <p className="text-sm text-muted-foreground">Order: {pkg.orderNumber}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium mb-1">{pkg.zone}</p>
                    <Badge variant={pkg.status === "PENDING_DISPATCH" ? "secondary" : "outline"}>
                      {pkg.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
