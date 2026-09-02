import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { WalletController } from "./wallet.controller";

const router = express.Router();

// User: Create crypto recharge invoice
router.post(
  "/recharge",
  auth(UserRole.USER, UserRole.ADMIN),
  WalletController.createRechargeInvoice
);

// User: Initialize Korapay African payment session
router.post(
  "/korapay/initialize",
  auth(UserRole.USER, UserRole.ADMIN),
  WalletController.initializeKorapay
);

// User/Public: Verify Korapay Payment (called on return or polling)
router.get(
  "/korapay/verify/:reference",
  WalletController.verifyKorapayPayment
);

// Public Webhook: Korapay Webhook listener
router.post(
  "/korapay/webhook",
  WalletController.handleKorapayWebhook
);

// User: Get personal invoices
router.get(
  "/invoices",
  auth(UserRole.USER, UserRole.ADMIN),
  WalletController.getMyInvoices
);

// Admin: Credit or Adjust any user balance
router.post(
  "/admin/credit",
  auth(UserRole.ADMIN),
  WalletController.adminCreditBalance
);

export const WalletRoutes = router;
