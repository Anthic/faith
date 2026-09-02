import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { CouponController } from "./coupon.controller";

const router = express.Router();

// Public / Authenticated: Validate Promo Code
router.post("/validate", CouponController.validateCoupon);

// Admin: CRUD coupons
router.get("/", auth(UserRole.ADMIN), CouponController.getAllCoupons);
router.post("/", auth(UserRole.ADMIN), CouponController.createCoupon);
router.delete("/:id", auth(UserRole.ADMIN), CouponController.deleteCoupon);

export const CouponRoutes = router;
