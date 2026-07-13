import { useFormContext } from "react-hook-form";
import type { OrderFormData } from "../schemas/orderSchemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";

export function PackageDetailsCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OrderFormData>();

  const pkgErrors = errors.packageDetails;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package & Order Details</CardTitle>
        <CardDescription>
          Specify the dimensions, weight, and order classifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="length">Length (cm)</Label>
            <Input id="length" type="number" step="0.1" {...register("packageDetails.length", { valueAsNumber: true })} />
            {pkgErrors?.length && (
              <p className="text-sm text-destructive">{pkgErrors.length.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Width (cm)</Label>
            <Input id="width" type="number" step="0.1" {...register("packageDetails.width", { valueAsNumber: true })} />
            {pkgErrors?.width && (
              <p className="text-sm text-destructive">{pkgErrors.width.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input id="height" type="number" step="0.1" {...register("packageDetails.height", { valueAsNumber: true })} />
            {pkgErrors?.height && (
              <p className="text-sm text-destructive">{pkgErrors.height.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="actualWeight">Weight (kg)</Label>
            <Input id="actualWeight" type="number" step="0.1" {...register("packageDetails.actualWeight", { valueAsNumber: true })} />
            {pkgErrors?.actualWeight && (
              <p className="text-sm text-destructive">{pkgErrors.actualWeight.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="orderType">Order Type</Label>
            <Select id="orderType" {...register("packageDetails.orderType")}>
              <option value="B2C">B2C (Business to Consumer)</option>
              <option value="B2B">B2B (Business to Business)</option>
            </Select>
            {pkgErrors?.orderType && (
              <p className="text-sm text-destructive">{pkgErrors.orderType.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select id="paymentType" {...register("packageDetails.paymentType")}>
              <option value="PREPAID">PREPAID</option>
              <option value="COD">COD (Cash on Delivery)</option>
            </Select>
            {pkgErrors?.paymentType && (
              <p className="text-sm text-destructive">{pkgErrors.paymentType.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
