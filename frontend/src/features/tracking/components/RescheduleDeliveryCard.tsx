import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { trackingApi } from "../api/trackingApi";

interface RescheduleDeliveryCardProps {
  orderId: string;
}

export function RescheduleDeliveryCard({ orderId }: RescheduleDeliveryCardProps) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rescheduleMutation = useMutation({
    mutationFn: (requestedDate: string) => trackingApi.rescheduleDelivery(orderId, requestedDate),
    onSuccess: () => {
      // Invalidate the tracking query so it re-fetches the PENDING status and new timeline event
      queryClient.invalidateQueries({ queryKey: ["tracking", orderId] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to reschedule delivery.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Please select a date.");
      return;
    }
    
    // Basic validation to ensure the date is in the future
    const selectedDate = new Date(date);
    if (selectedDate < new Date()) {
      setError("Please select a future date.");
      return;
    }

    rescheduleMutation.mutate(new Date(date).toISOString());
  };

  return (
    <Card className="border-destructive/50 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
      <CardHeader className="bg-destructive/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Delivery Failed
        </CardTitle>
        <CardDescription>
          Unfortunately, we were unable to complete this delivery. Please select a new date to reschedule.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Select New Delivery Date
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full sm:w-[250px]"
                disabled={rescheduleMutation.isPending}
              />
            </div>
            
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 py-4 border-t">
          <Button 
            type="submit" 
            disabled={!date || rescheduleMutation.isPending}
            className="w-full sm:w-auto"
          >
            {rescheduleMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Rescheduling...
              </span>
            ) : (
              "Confirm Reschedule"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
