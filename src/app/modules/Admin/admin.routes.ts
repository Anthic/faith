import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { AdminController } from "./admin.controller";

const router = express.Router();

// Strict Admin protection
router.use(auth(UserRole.ADMIN));

// 1. Dashboard Overview Metrics
router.get("/overview", AdminController.getOverview);

export const AdminRoutes = router;
