import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { UserController } from "./user.controller";

const router = express.Router();

// 1. Get All Users (Admin)
router.get("/", auth(UserRole.ADMIN), UserController.getAllUsers);

// 2. Get User By ID (Admin)
router.get("/:id", auth(UserRole.ADMIN), UserController.getUserById);

// 3. Update User Status (Admin)
router.patch(
  "/status/:id",
  auth(UserRole.ADMIN),
  UserController.updateUserStatus
);

// 4. Adjust User Balance (Admin)
router.post(
  "/adjust-balance/:id",
  auth(UserRole.ADMIN),
  UserController.adjustUserBalance
);

// 5. Update Profile (Self)
router.patch(
  "/update-profile",
  auth(UserRole.USER, UserRole.ADMIN),
  UserController.updateProfile
);

// 6. Regenerate Developer API Key (Self)
router.post(
  "/regenerate-api-key",
  auth(UserRole.USER, UserRole.ADMIN),
  UserController.regenerateApiKey
);

export const UserRoutes = router;
