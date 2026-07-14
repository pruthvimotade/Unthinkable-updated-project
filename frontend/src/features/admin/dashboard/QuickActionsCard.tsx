import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { PlusCircle, UserPlus, Map, MapPin, Calculator, Truck, AlertTriangle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <Card className="col-span-1 bg-zinc-950/30 border-white/5 backdrop-blur-xl">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-base font-black tracking-tight text-white">Operations Control</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 grid gap-2.5">
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/orders/create")}
        >
          <PlusCircle className="mr-2.5 h-4 w-4 text-zinc-400" />
          Create Shipment
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/orders")}
        >
          <UserPlus className="mr-2.5 h-4 w-4 text-zinc-400" />
          Auto Assign Agents
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/orders?status=FAILED")}
        >
          <AlertTriangle className="mr-2.5 h-4 w-4 text-zinc-400" />
          Review Failed Deliveries
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/zones")}
        >
          <Map className="mr-2.5 h-4 w-4 text-zinc-400" />
          Manage Service Zones
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/areas")}
        >
          <MapPin className="mr-2.5 h-4 w-4 text-zinc-400" />
          Configure Areas
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/rate-cards")}
        >
          <Calculator className="mr-2.5 h-4 w-4 text-zinc-400" />
          Rate Calculation Engine
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/agents")}
        >
          <Truck className="mr-2.5 h-4 w-4 text-zinc-400" />
          Fleet Management
        </Button>
        <Button 
          variant="outline" 
          className="justify-start border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-xs font-semibold rounded-xl h-11 cursor-pointer" 
          onClick={() => navigate("/admin/orders")}
        >
          <BarChart3 className="mr-2.5 h-4 w-4 text-zinc-400" />
          Order Pipeline
        </Button>
      </CardContent>
    </Card>
  );
}

