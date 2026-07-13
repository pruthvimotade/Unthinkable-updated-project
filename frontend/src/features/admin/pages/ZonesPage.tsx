import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Loader2, Plus, Edit2 } from "lucide-react";
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

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Zones Management</h1>
        <Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-2" /> Add Zone</Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones?.map((zone: any) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.code}</TableCell>
                <TableCell>{zone.name}</TableCell>
                <TableCell>
                  <Badge variant={zone.isActive ? "default" : "secondary"}>
                    {zone.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(zone.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openModal(zone)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!zones || zones.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No zones found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? "Edit Zone" : "Create Zone"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="North Region" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input {...register("code")} placeholder="NRTH" />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message as string}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isActive" {...register("isActive")} />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingZone ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
