"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserCheck, UserX, DollarSign, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  downlines: Array<{ count: number }>;
  commissions: Array<{ amount: string }>;
  submissions: Array<{ count: number }>;
}

interface AgentManagementProps {
  agents: Agent[];
}

export function AgentManagement({ agents }: AgentManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;
    const matchesRole = roleFilter === "all" || agent.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    setIsLoading(agentId);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", agentId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error("Error updating agent status:", error);
      alert("Failed to update agent status");
    } finally {
      setIsLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getRoleColor = (role: string) => {
    return role === "admin" ? "destructive" : "outline";
  };

  const calculateTotalEarnings = (commissions: Array<{ amount: string }>) => {
    return commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  };

  const getDownlineCount = (downlines: Array<{ count: number }>) => {
    return downlines.length > 0 ? downlines[0].count : 0;
  };

  const getSubmissionCount = (submissions: Array<{ count: number }>) => {
    return submissions.length > 0 ? submissions[0].count : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Agents</CardTitle>
        <CardDescription>
          Manage agent accounts, monitor performance, and update statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search agents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agents Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Downlines</TableHead>
                <TableHead className="text-center">Submissions</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No agents found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {agent.full_name || "No name"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agent.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(agent.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getRoleColor(agent.role)}
                        className="capitalize"
                      >
                        {agent.role}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getStatusColor(agent.status)}
                        className="capitalize"
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {getDownlineCount(agent.downlines)}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {getSubmissionCount(agent.submissions)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        {calculateTotalEarnings(agent.commissions).toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {agent.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(agent.id, "suspended")
                            }
                            disabled={isLoading === agent.id}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(agent.id, "active")
                            }
                            disabled={isLoading === agent.id}
                          >
                            <UserCheck className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredAgents.length} of {agents.length} agents
        </div>
      </CardContent>
    </Card>
  );
}
