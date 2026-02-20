export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "staff"
  | "agent"
  | "buyer";

export const isAdminRole = (role?: string | null) =>
  role === "admin" || role === "super_admin";

export const isManagerRole = (role?: string | null) => role === "manager";

export const isAdminOrManager = (role?: string | null) =>
  role === "admin" || role === "super_admin" || role === "manager";

export const canManageUsers = (role?: string | null) =>
  role === "admin" || role === "super_admin";
