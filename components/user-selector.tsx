"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserSelectorProps {
  selectedUserId?: string;
}

export function UserSelector({ selectedUserId }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const currentParams = new URLSearchParams(searchParams?.toString());
    currentParams.set("userId", userId);
    router.push(`?${currentParams.toString()}`);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="buyer">Buyers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <Select
              value={selectedUserId || ""}
              onValueChange={handleUserSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to manage documents for..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading users...
                  </SelectItem>
                ) : filteredUsers.length === 0 ? (
                  <SelectItem value="no-results" disabled>
                    No users found
                  </SelectItem>
                ) : (
                  filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {user.full_name || user.email} - {user.email}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              Found {filteredUsers.length} user(s)
              {roleFilter !== "all" && ` with role: ${roleFilter}`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
