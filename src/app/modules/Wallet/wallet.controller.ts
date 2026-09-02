import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { WalletService } from "./wallet.service";

// 1. Create Crypto Recharge Invoice
const createRechargeInvoice = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WalletService.createRechargeInvoice(user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Recharge invoice created successfully",
    data: result,
  });
});

// 2. Initialize Korapay Session
const initializeKorapay = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { amountNgn } = req.body;
  const result = await WalletService.initializeKorapay(user.id, {
    amountNgn: Number(amountNgn),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Korapay payment session initialized",
    data: result,
  });
});

// 3. Verify Korapay Payment
const verifyKorapayPayment = catchAsync(async (req: Request, res: Response) => {
  const { reference } = req.params;
  const result = await WalletService.verifyKorapayPayment(reference);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || "Payment verification completed",
    data: result,
  });
});

// 4. Korapay Webhook Receiver
const handleKorapayWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = (req.headers["x-korapay-signature"] as string) || "";
  const result = await WalletService.handleKorapayWebhook(req.body, signature);

  res.status(httpStatus.OK).json({ status: true, message: "Webhook acknowledged" });
});

// 5. Get My Invoices
const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await WalletService.getMyInvoices(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices retrieved successfully",
    data: result,
  });
});

// 6. Admin: Credit or Adjust User Balance
const adminCreditBalance = catchAsync(async (req: Request, res: Response) => {
  const admin = (req as any).user;
  const result = await WalletService.adminCreditBalance(admin.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Balance updated for ${result.username}`,
    data: result,
  });
});

export const WalletController = {
  createRechargeInvoice,
  initializeKorapay,
  verifyKorapayPayment,
  handleKorapayWebhook,
  getMyInvoices,
  adminCreditBalance,
};
