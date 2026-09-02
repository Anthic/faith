import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { ActivityLogController } from "./activityLog.controller";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  ActivityLogController.getMyLogs
);

export const ActivityLogRoutes = router;
