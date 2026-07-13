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

  if (areasLoading || zonesLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Areas Management</h1>
        <Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-2" /> Add Area</Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Pincode</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas?.map((area: any) => (
              <TableRow key={area.id}>
                <TableCell className="font-medium">{area.code}</TableCell>
                <TableCell>{area.name}</TableCell>
                <TableCell>{area.pincode}</TableCell>
                <TableCell>{area.zone?.name}</TableCell>
                <TableCell>
                  <Badge variant={area.isActive ? "default" : "secondary"}>
                    {area.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openModal(area)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!areas || areas.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No areas found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? "Edit Area" : "Create Area"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Andheri East" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input {...register("code")} placeholder="AND-E" />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input {...register("pincode")} placeholder="400069" />
                {errors.pincode && <p className="text-sm text-red-500">{errors.pincode.message as string}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select {...register("zoneId")}>
                <option value="">Select a Zone</option>
                {zones?.map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </Select>
              {errors.zoneId && <p className="text-sm text-red-500">{errors.zoneId.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" {...register("latitude")} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" {...register("longitude")} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isActive" {...register("isActive")} />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingArea ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
