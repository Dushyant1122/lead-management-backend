// ============================================================================
//                                 USER MODEL
// ============================================================================

// User roles
export type UserRoleTypes = "ADMIN" | "MANAGER" | "BACKEND" | "TELECALLER";

export const UserRoleValues = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  BACKEND: "BACKEND",
  TELECALLER: "TELECALLER",
} as const;



export const AvailableUserRoles = Object.values(UserRoleValues);

// User logins
export type UserLoginTypes = "OTP_BASED";

export const UserLoginValues = {
  OTP_BASED: "OTP_BASED",
} as const;

export const AvailableUserLogins = Object.values(UserLoginValues);

// User status
export type UserStatusTypes = "ACTIVE" | "INACTIVE";

export const UserStatusValues = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

