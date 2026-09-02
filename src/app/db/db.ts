import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../shared/prisma";

export const initiateSuperAdmin = async () => {
  const payload = {
    username: "admin",
    email: "admin@smvaults.com",
    password: "Password123",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    apiKey: "smv_admin_master_key",
    balance: 9999.0,
  };

  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { username: payload.username }],
    },
  });

  if (existingSuperAdmin) {
    return;
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  await prisma.user.create({
    data: {
      username: payload.username,
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
      status: payload.status,
      apiKey: payload.apiKey,
      balance: payload.balance,
    },
  });

  console.log("⚡ Default Admin created: admin / Password123");
};
