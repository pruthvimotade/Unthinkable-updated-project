import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Loader2, Plus, Edit2, MapPin } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  pincode: z.string().min(1, "Pincode is required"),
  zoneId: z.string().uuid("Zone is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
});

export function AreasPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);

  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ["admin-areas"],
    queryFn: () => adminApi.getAreas()
  });

  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ["admin-zones"],
    queryFn: adminApi.getZones
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: "", code: "", pincode: "", zoneId: "", latitude: undefined, longitude: undefined, isActive: true }
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createArea,
    onSuccess: () => {
      success("Area created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-areas"] });
      closeModal();
    },
    onError: () => error("Failed to create area")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateArea(id, data),
    onSuccess: () => {
      success("Area updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-areas"] });
      closeModal();
    },
    onError: () => error("Failed to update area")
  });

  const openModal = (area: any = null) => {
    setEditingArea(area);
    if (area) {
      setValue("name", area.name);
      setValue("code", area.code);
      setValue("pincode", area.pincode);
      setValue("zoneId", area.zoneId);
      setValue("latitude", area.latitude);
      setValue("longitude", area.longitude);
      setValue("isActive", area.isActive);
    } else {
      reset({ name: "", code: "", pincode: "", zoneId: "", latitude: undefined, longitude: undefined, isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
    reset();
  };

  const onSubmit = (formData: any) => {
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (areasLoading || zonesLoading) {
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
            Areas Management
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Configure operational areas, pincodes, and coordinates.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 px-4 shadow-lg shadow-indigo-500/10 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Area
        </Button>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Code</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Pincode</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Zone</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas?.map((area: any) => (
              <TableRow key={area.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                <TableCell className="font-bold text-xs text-indigo-400">{area.code}</TableCell>
                <TableCell className="text-xs text-zinc-200 font-semibold">{area.name}</TableCell>
                <TableCell className="text-xs text-zinc-400 font-mono">{area.pincode}</TableCell>
                <TableCell className="text-xs text-zinc-400">{area.zone?.name}</TableCell>
                <TableCell>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    area.isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-zinc-800 text-zinc-500 border border-white/5"
                  }`}>
                    {area.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openModal(area)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!areas || areas.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <MapPin className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-zinc-500 font-semibold">No operational areas configured.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white">
              {editingArea ? "Edit Area Details" : "Add Operational Area"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Area Name</Label>
              <Input {...register("name")} placeholder="Andheri East" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Code</Label>
                <Input {...register("code")} placeholder="AND-E" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
                {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Pincode</Label>
                <Input {...register("pincode")} placeholder="400069" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
                {errors.pincode && <p className="text-xs text-red-400 mt-1">{errors.pincode.message as string}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Associated Zone</Label>
              <Select {...register("zoneId")} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
                <option value="">Select a Zone</option>
                {zones?.map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </Select>
              {errors.zoneId && <p className="text-xs text-red-400 mt-1">{errors.zoneId.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Latitude</Label>
                <Input type="number" step="any" {...register("latitude")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 font-bold text-xs">Longitude</Label>
                <Input type="number" step="any" {...register("longitude")} className="bg-white/[0.02] border-white/10 text-white rounded-xl h-11" />
              </div>
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
                {editingArea ? "Save Updates" : "Create Area"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

