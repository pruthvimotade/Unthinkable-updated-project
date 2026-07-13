import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

import { orderFormSchema, type OrderFormData } from "../schemas/orderSchemas";
import { orderApi, type CalculatePriceResponse } from "../api/orderApi";
import { PickupDetailsCard, DropDetailsCard } from "../components/AddressDetailsCards";
import { PackageDetailsCard } from "../components/PackageDetailsCard";
import { PricingSummaryCard } from "../components/PricingSummaryCard";
import { OrderConfirmationDialog } from "../components/OrderConfirmationDialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { adminApi } from "../../admin/api/adminApi";

export function CreateOrderPage() {
  const navigate = useNavigate();
  const { error } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [pricingSummary, setPricingSummary] = useState<CalculatePriceResponse["data"]["pricing"] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const methods = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      packageDetails: {
        orderType: "B2C",
        paymentType: "PREPAID",
      },
    },
    mode: "onChange"
  });

  const { handleSubmit, getValues, formState: { isValid }, register } = methods;

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: adminApi.getCustomers,
    enabled: user?.role === "ADMIN"
  });

  const calculateMutation = useMutation({
    mutationFn: orderApi.calculatePrice,
    onSuccess: (data) => {
      setPricingSummary(data.data.pricing);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      error(err.response?.data?.message || "Failed to calculate price");
      setPricingSummary(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: orderApi.createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      // Redirect to tracking page
      navigate(`/tracking/${data.data.id}`);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      error(err.response?.data?.message || "Failed to create order");
      setShowConfirm(false);
    }
  });

  const handleCalculate = async () => {
    const valid = await methods.trigger();
    if (!valid) return;

    const data = getValues();
    calculateMutation.mutate({
      pickupPincode: data.pickup.pincode,
      pickupLatitude: data.pickup.latitude,
      pickupLongitude: data.pickup.longitude,
      dropPincode: data.drop.pincode,
      dropLatitude: data.drop.latitude,
      dropLongitude: data.drop.longitude,
      length: data.packageDetails.length,
      width: data.packageDetails.width,
      height: data.packageDetails.height,
      actualWeight: data.packageDetails.actualWeight,
      orderType: data.packageDetails.orderType,
      paymentType: data.packageDetails.paymentType,
    });
  };

  const onFinalSubmit = () => {
    const data = getValues();
    createMutation.mutate({
      pickupPincode: data.pickup.pincode,
      dropPincode: data.drop.pincode,
      pickupAddress: data.pickup.addressLine1,
      pickupAddressLine2: data.pickup.addressLine2,
      pickupContact: `${data.pickup.contactName} - ${data.pickup.phone}`,
      pickupLatitude: data.pickup.latitude,
      pickupLongitude: data.pickup.longitude,
      pickupPlaceId: data.pickup.placeId,
      dropAddress: data.drop.addressLine1,
      dropAddressLine2: data.drop.addressLine2,
      dropContact: `${data.drop.contactName} - ${data.drop.phone}`,
      dropLatitude: data.drop.latitude,
      dropLongitude: data.drop.longitude,
      dropPlaceId: data.drop.placeId,
      length: data.packageDetails.length,
      width: data.packageDetails.width,
      height: data.packageDetails.height,
      actualWeight: data.packageDetails.actualWeight,
      orderType: data.packageDetails.orderType,
      paymentType: data.packageDetails.paymentType,
      customerId: data.customerId,
      assignmentMode: data.assignmentMode,
    });
  };

  const onPreSubmit = (_data: OrderFormData) => {
    if (!pricingSummary) {
      handleCalculate();
      return;
    }
    setShowConfirm(true);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6 pb-24">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Order</h1>
            <p className="text-muted-foreground">Fill in the details to generate a shipping quote.</p>
          </div>
          {pricingSummary && (
            <Button type="submit" size="lg" className="hidden lg:flex">
              Confirm & Create Order
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 items-start">
          
          {/* Left Column: Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            {user?.role === "ADMIN" && (
              <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                <h2 className="text-xl font-semibold">Customer Selection (Admin Override)</h2>
                <div className="space-y-2 max-w-md">
                  <Label>Assign Order to Customer</Label>
                  <Select {...register("customerId")} disabled={isLoadingCustomers}>
                    <option value="">Select a customer (Optional)</option>
                    {customersData?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 max-w-md">
                  <Label>Assignment Mode</Label>
                  <Select {...register("assignmentMode")}>
                    <option value="AUTO">Auto Assignment (Default)</option>
                    <option value="MANUAL">Manual Assignment</option>
                  </Select>
                </div>
              </div>
            )}
            <PickupDetailsCard />
            <DropDetailsCard />
            <PackageDetailsCard />
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-1">
            <PricingSummaryCard 
              summary={pricingSummary}
              onCalculate={handleCalculate}
              isLoading={calculateMutation.isPending}
              canCalculate={isValid}
            />

            {/* Mobile Submit Button */}
            {pricingSummary && (
              <Button type="submit" size="lg" className="w-full mt-6 lg:hidden">
                Confirm & Create Order
              </Button>
            )}
          </div>
        </div>
      </form>

      <OrderConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        summary={pricingSummary}
        paymentType={methods.getValues("packageDetails.paymentType")}
        onConfirm={onFinalSubmit}
        isConfirming={createMutation.isPending}
      />
    </FormProvider>
  );
}
