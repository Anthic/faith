import { UserRole, UserStatus } from "@prisma/client";

export type TUserFilterRequest = {
  searchTerm?: string;
  role?: UserRole;
  status?: UserStatus;
};

export type TUpdateProfile = {
  telegramUsername?: string;
  currency?: string;
};
