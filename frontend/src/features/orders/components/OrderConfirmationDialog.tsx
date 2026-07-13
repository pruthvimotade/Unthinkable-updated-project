import type { CalculatePriceResponse } from "../api/orderApi";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { formatINR } from "../../../utils/currency";
import { Loader2 } from "lucide-react";

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CalculatePriceResponse["data"] | null;
  paymentType?: "PREPAID" | "COD";
  onConfirm: () => void;
  isConfirming: boolean;
}

export function OrderConfirmationDialog({
  open,
  onOpenChange,
  summary,
  paymentType,
  onConfirm,
  isConfirming,
}: OrderConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Confirm Order Creation</DialogTitle>
        <DialogDescription>
          Please review the final amount before creating this order. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      
      {summary && (
        <div className="py-4 border-y my-4 text-center">
          <span className="text-4xl font-bold text-primary">{formatINR(summary.finalPrice)}</span>
          <p className="text-sm text-muted-foreground mt-1">To be paid via {paymentType}</p>
        </div>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isConfirming}
        >
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm & Create Order
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
