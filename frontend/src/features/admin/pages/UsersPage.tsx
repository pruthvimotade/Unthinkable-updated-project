import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { Loader2, Plus, Users } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

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
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center bg-zinc-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Users Management
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Configure user accounts, administrative permissions, and roles.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 px-4 shadow-lg shadow-indigo-500/10 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-64">
          <Select 
            value={roleFilter} 
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="text-xs h-9 rounded-xl border-white/5 bg-zinc-900 text-zinc-300 px-3 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="AGENT">Agent</option>
            <option value="CUSTOMER">Customer</option>
          </Select>
        </div>
      </div>

      <div className="bg-zinc-950/30 border-white/5 backdrop-blur-xl p-6 rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Role</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Created</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                <TableCell className="font-bold text-xs text-zinc-200">{user.name}</TableCell>
                <TableCell className="text-xs text-zinc-400">{user.email}</TableCell>
                <TableCell>
                  <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    user.status === "ACTIVE" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-zinc-800 text-zinc-500 border border-white/5"
                  }`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {user.role !== "ADMIN" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleStatus(user)} 
                      disabled={statusMutation.isPending}
                      className="border-white/5 hover:bg-white/[0.05] hover:text-white text-xs rounded-xl py-1 px-3 cursor-pointer"
                    >
                      {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-zinc-500 font-semibold">No users registered.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl cursor-pointer">
            Previous
          </Button>
          <span className="text-xs text-zinc-400 font-semibold font-mono">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl cursor-pointer">
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-white">Create Staff User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Full Name</Label>
              <Input {...register("name")} placeholder="Jane Doe" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Email Address</Label>
              <Input type="email" {...register("email")} placeholder="jane@company.com" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Password</Label>
              <Input type="password" {...register("password")} placeholder="••••••••" className="bg-white/[0.02] border-white/10 text-white placeholder-zinc-500 rounded-xl h-11" />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 font-bold text-xs">Assign Role</Label>
              <Select {...register("role")} className="bg-zinc-900 border-white/10 text-white rounded-xl h-11 px-3 cursor-pointer">
                <option value="AGENT">Delivery Agent</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/5 hover:bg-white/[0.02] text-xs rounded-xl h-11 cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl h-11 cursor-pointer">
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

