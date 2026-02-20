"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { CreateAccountModal } from "@/components/create-account-modal";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  phone: string | null;
}

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string>>(
    {},
  );
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-200 text-purple-900 border-purple-300";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "agent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "buyer":
        return "bg-green-100 text-green-800 border-green-200";
      case "staff":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleRoleChange = async (userId: string, nextRole: string) => {
    const currentRole =
      rolesByUserId[userId] || users.find((user) => user.id === userId)?.role;

    if (!currentRole || currentRole === nextRole) return;

    setUpdatingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update user role");
      }

      setRolesByUserId((prev) => ({ ...prev, [userId]: nextRole }));
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Unable to update user role.",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="buyer">Buyers</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          {/* Create Account Button */}
          <CreateAccountModal />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.full_name || "No name"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rolesByUserId[user.id] || user.role}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value)
                      }
                      disabled={
                        updatingUserId === user.id ||
                        user.role === "super_admin"
                      }
                    >
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin" disabled>
                          Super Admin
                        </SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <Badge
                        className={getRoleColor(
                          rolesByUserId[user.id] || user.role,
                        )}
                      >
                        {rolesByUserId[user.id] || user.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        (user as any).agent_activated
                          ? "text-green-900 bg-green-50"
                          : "text-orange-500 bg-orange-50"
                      }
                    >
                      {(user as any).agent_activated
                        ? "Activated"
                        : "Not activated"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.phone || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/users/${user.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchTerm || roleFilter !== "all"
                    ? "No users match your search criteria"
                    : "No users found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* Results count */}
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
