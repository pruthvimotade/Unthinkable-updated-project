import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { formatINR } from "../../../utils/currency";
import { Loader2, Plus, Edit2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const rateCardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rateType: z.enum(["BASE", "PER_KG", "PER_KM", "FLAT", "INTRA_ZONE", "INTER_ZONE"]),
  orderType: z.enum(["B2B", "B2C"]),
  basePrice: z.coerce.number().min(0, "Base price must be positive"),
  perUnitPrice: z.coerce.number().optional(),
  minWeight: z.coerce.number().optional(),
  maxWeight: z.coerce.number().optional(),
  codSurcharge: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export function RateCardsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<any>(null);

  const { data: rateCards, isLoading } = useQuery({
    queryKey: ["admin-rate-cards"],
    queryFn: adminApi.getRateCards
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(rateCardSchema),
    defaultValues: { name: "", rateType: "INTRA_ZONE" as any, orderType: "B2C", basePrice: 0, perUnitPrice: 0, minWeight: 0, maxWeight: 0, codSurcharge: 0, isActive: true }
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createRateCard,
    onSuccess: () => {
      success("Rate card created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-rate-cards"] });
      closeModal();
    },
    onError: () => error("Failed to create rate card")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateRateCard(id, data),
    onSuccess: () => {
      success("Rate card updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-rate-cards"] });
      closeModal();
    },
    onError: () => error("Failed to update rate card")
  });

  const openModal = (rc: any = null) => {
    setEditingRateCard(rc);
    if (rc) {
      setValue("name", rc.name);
      setValue("rateType", rc.rateType);
      setValue("orderType", rc.orderType);
      setValue("basePrice", rc.basePrice);
      setValue("perUnitPrice", rc.perUnitPrice);
      setValue("minWeight", rc.minWeight);
      setValue("maxWeight", rc.maxWeight);
      setValue("codSurcharge", rc.codSurcharge);
      setValue("isActive", rc.isActive);
    } else {
      reset({ name: "", rateType: "INTRA_ZONE" as any, orderType: "B2C", basePrice: 0, perUnitPrice: 0, minWeight: 0, maxWeight: 0, codSurcharge: 0, isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRateCard(null);
    reset();
  };

  const onSubmit = (formData: any) => {
    if (editingRateCard) {
      updateMutation.mutate({ id: editingRateCard.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Rate Cards Management</h1>
        <Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-2" /> Add Rate Card</Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rate Type</TableHead>
              <TableHead>Order Type</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Per Unit Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateCards?.map((rc: any) => (
              <TableRow key={rc.id}>
                <TableCell className="font-medium">{rc.name}</TableCell>
                <TableCell>{rc.rateType.replace(/_/g, ' ')}</TableCell>
                <TableCell>{rc.orderType}</TableCell>
                <TableCell>{formatINR(rc.basePrice)}</TableCell>
                <TableCell>{rc.perUnitPrice ? formatINR(rc.perUnitPrice) : "-"}</TableCell>
                <TableCell>
                  <Badge variant={rc.isActive ? "default" : "secondary"}>
                    {rc.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openModal(rc)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!rateCards || rateCards.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No rate cards found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRateCard ? "Edit Rate Card" : "Create Rate Card"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Standard B2C" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Type</Label>
                <Select {...register("rateType")}>
                  <option value="INTRA_ZONE">Intra-Zone</option>
                  <option value="INTER_ZONE">Inter-Zone</option>
                  <option value="BASE">Base</option>
                  <option value="PER_KG">Per KG</option>
                  <option value="PER_KM">Per KM</option>
                  <option value="FLAT">Flat</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select {...register("orderType")}>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price (₹)</Label>
                <Input type="number" step="0.01" {...register("basePrice")} />
              </div>
              <div className="space-y-2">
                <Label>Per Unit Price (₹)</Label>
                <Input type="number" step="0.01" {...register("perUnitPrice")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Weight (kg)</Label>
                <Input type="number" step="0.01" {...register("minWeight")} />
              </div>
              <div className="space-y-2">
                <Label>Max Weight (kg)</Label>
                <Input type="number" step="0.01" {...register("maxWeight")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>COD Surcharge (₹)</Label>
              <Input type="number" step="0.01" {...register("codSurcharge")} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isActive" {...register("isActive")} />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRateCard ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
