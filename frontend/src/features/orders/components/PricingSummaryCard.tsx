import type { CalculatePriceResponse } from "../api/orderApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Loader2 } from "lucide-react";
import { formatINR } from "../../../utils/currency";

interface PricingSummaryCardProps {
  summary: CalculatePriceResponse["data"] | null;
  onCalculate: () => void;
  isLoading: boolean;
  canCalculate: boolean;
}

export function PricingSummaryCard({
  summary,
  onCalculate,
  isLoading,
  canCalculate,
}: PricingSummaryCardProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle>Pricing Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {!summary ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Fill in the order details and click calculate to see the price breakdown.
          </div>
        ) : (
          <>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Routing</span>
                <span className="font-medium text-right">
                  {summary.pickupZone?.name || "Global Map"} → {summary.dropZone?.name || "Global Map"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zone Type</span>
                <span className="font-medium">{summary.zoneType}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actual Weight</span>
                <span>{summary.actualWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volumetric Weight</span>
                <span>{summary.volumetricWeight} kg</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Billable Weight</span>
                <span>{summary.billableWeight} kg</span>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price</span>
                <span>{formatINR(summary.basePrice)}</span>
              </div>
              {summary.codCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COD Surcharge</span>
                  <span>{formatINR(summary.codCharge)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="font-semibold text-base">Total</span>
              <span className="font-bold text-2xl text-primary">
                {formatINR(summary.finalPrice)}
              </span>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 border-t pt-6">
        <Button
          type="button"
          className="w-full"
          variant={summary ? "outline" : "default"}
          onClick={onCalculate}
          disabled={!canCalculate || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {summary ? "Recalculate Price" : "Calculate Price"}
        </Button>
      </CardFooter>
    </Card>
  );
}
