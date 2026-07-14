import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Loader2, Plus, Edit2, Map } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const zoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  isActive: z.boolean().default(true),
});

export function ZonesPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);

  const { data: zones, isLoading } = useQuery({
    queryKey: ["admin-zones"],
    queryFn: adminApi.getZones
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(zoneSchema),
    defaultValues: { name: "", code: "", isActive: true }
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createZone,
    onSuccess: () => {
      success("Zone created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-zones"] });
      closeModal();
    },
    onError: () => error("Failed to create zone")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateZone(id, data),
    onSuccess: () => {
      success("Zone updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-zones"] });
      closeModal();
    },
    onError: () => error("Failed to update zone")
  });

  const openModal = (zone: any = null) => {
    setEditingZone(zone);
    if (zone) {
      setValue("name", zone.name);
      setValue("code", zone.code);
      setValue("isActive", zone.isActive);
    } else {
      reset({ name: "", code: "", isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingZone(null);
    reset();
  };

  const onSubmit = (formData: any) => {
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data: formData });
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
            Zones Management
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Configure geographical zones and operational boundaries.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 px-4 shadow-lg shadow-indigo-500/10 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Zone
        </Button>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Code</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Created</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones?.map((zone: any) => (
              <TableRow key={zone.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                <TableCell className="font-bold text-xs text-indigo-400">{zone.code}</TableCell>
                <TableCell className="text-xs text-zinc-200 font-semibold">{zone.name}</TableCell>
                <TableCell>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    zone.isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-zinc-800 text-zinc-500 border border-white/5"
                  }`}>
                    {zone.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-zinc-500">{new Date(zone.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openModal(zone)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!zones || zones.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Map className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-zinc-500 font-semibold">No zones configured yet.</p>
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
              {editingZone ? "Edit Zone Config" : "Add Operational Zone"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Zone Name</Label>
              <Input {...register("name")} placeholder="North Region" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Code Indicator</Label>
              <Input {...register("code")} placeholder="NRTH" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code.message as string}</p>}
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
                {editingZone ? "Save Updates" : "Create Zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

