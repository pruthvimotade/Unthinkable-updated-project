import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { PlusCircle, UserPlus, Map, MapPin, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" className="justify-start" onClick={() => navigate("/orders/create")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Order
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate("/admin/orders")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Agent
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate("/admin/zones")}>
          <Map className="mr-2 h-4 w-4" />
          Manage Zones
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate("/admin/areas")}>
          <MapPin className="mr-2 h-4 w-4" />
          Manage Areas
        </Button>
        <Button variant="outline" className="justify-start" onClick={() => navigate("/admin/rate-cards")}>
          <Calculator className="mr-2 h-4 w-4" />
          Manage Rate Cards
        </Button>
      </CardContent>
    </Card>
  );
}
