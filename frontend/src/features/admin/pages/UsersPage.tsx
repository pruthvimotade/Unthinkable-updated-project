import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "AGENT"])
});

export function UsersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, roleFilter],
    queryFn: () => adminApi.getUsers({ page, limit: 20, role: roleFilter || undefined })
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "AGENT", name: "", email: "", password: "", phone: "" }
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsCreateOpen(false);
      reset();
    },
    onError: () => error("Failed to create user")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => error("Failed to update status")
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  const onSubmit = (formData: any) => {
    createMutation.mutate(formData);
  };

  const toggleStatus = (user: any) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate({ id: user.id, status: newStatus });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
        <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Staff</Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-64">
          <Select value={roleFilter} onChange={(e: any) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="AGENT">Agent</option>
            <option value="CUSTOMER">Customer</option>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell>
                  <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {user.role !== "ADMIN" && (
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(user)} disabled={statusMutation.isPending}>
                      {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span>Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select {...register("role")}>
                <option value="AGENT">Delivery Agent</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
