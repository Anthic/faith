import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { OrderController } from "./order.controller";

const router = express.Router();

// User: Buy product instantly
router.post("/buy", auth(UserRole.USER, UserRole.ADMIN), OrderController.buyProduct);

// User: Get personal order history
router.get("/", auth(UserRole.USER, UserRole.ADMIN), OrderController.getMyOrders);

// User: Get single order details
router.get("/:id", auth(UserRole.USER, UserRole.ADMIN), OrderController.getOrderById);

// User: Download credentials as .txt
router.get("/:id/download", auth(UserRole.USER, UserRole.ADMIN), OrderController.downloadOrderTxt);

// Admin: View all orders across platform
router.get("/admin/all", auth(UserRole.ADMIN), OrderController.getAllOrdersAdmin);

export const OrderRoutes = router;
