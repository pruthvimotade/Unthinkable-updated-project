import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { formatINR } from "../../../utils/currency";
import { Loader2, Plus, Edit2, Calculator } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Rate Cards Management
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Configure pricing algorithms, weights slabs, and surcharges.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 px-4 shadow-lg shadow-indigo-500/10 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Rate Card
        </Button>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rate Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Order Type</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Base Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Per Unit Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateCards?.map((rc: any) => (
              <TableRow key={rc.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                <TableCell className="font-bold text-xs text-zinc-200">{rc.name}</TableCell>
                <TableCell className="text-xs text-zinc-400 font-semibold">{rc.rateType.replace(/_/g, ' ')}</TableCell>
                <TableCell className="text-xs text-zinc-400 font-mono">{rc.orderType}</TableCell>
                <TableCell className="text-xs text-zinc-200 font-bold">{formatINR(rc.basePrice)}</TableCell>
                <TableCell className="text-xs text-zinc-400">{rc.perUnitPrice ? formatINR(rc.perUnitPrice) : "-"}</TableCell>
                <TableCell>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    rc.isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-zinc-800 text-zinc-500 border border-white/5"
                  }`}>
                    {rc.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openModal(rc)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!rateCards || rateCards.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Calculator className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-zinc-500 font-semibold">No rate cards found.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white">
              {editingRateCard ? "Edit Rate Card" : "Add Rate Card"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Name</Label>
              <Input {...register("name")} placeholder="Standard B2C" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Rate Type</Label>
                <Select {...register("rateType")} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
                  <option value="INTRA_ZONE">Intra-Zone</option>
                  <option value="INTER_ZONE">Inter-Zone</option>
                  <option value="BASE">Base</option>
                  <option value="PER_KG">Per KG</option>
                  <option value="PER_KM">Per KM</option>
                  <option value="FLAT">Flat</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Order Type</Label>
                <Select {...register("orderType")} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Base Price (₹)</Label>
                <Input type="number" step="0.01" {...register("basePrice")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Per Unit Price (₹)</Label>
                <Input type="number" step="0.01" {...register("perUnitPrice")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Min Weight (kg)</Label>
                <Input type="number" step="0.01" {...register("minWeight")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Max Weight (kg)</Label>
                <Input type="number" step="0.01" {...register("maxWeight")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">COD Surcharge (₹)</Label>
              <Input type="number" step="0.01" {...register("codSurcharge")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
            </div>
            <div className="flex items-center space-x-2.5">
              <input type="checkbox" id="isActive" {...register("isActive")} className="w-4 h-4 rounded border-white/10 accent-indigo-500 bg-white/[0.02]" />
              <Label htmlFor="isActive" className="text-xs text-zinc-300 font-bold cursor-pointer">Set Active Status</Label>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={closeModal} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl h-11 cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl h-11 cursor-pointer">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRateCard ? "Save Updates" : "Create Card"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

