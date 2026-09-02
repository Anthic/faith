import express from "express";
import apiKeyAuth from "../../middlewares/apiKeyAuth";
import { ResellerController } from "./reseller.controller";

const router = express.Router();

// All Reseller endpoints authenticate via X-API-KEY / Bearer API Key
router.use(apiKeyAuth());

// 1. Reseller Balance Check
router.get("/me", ResellerController.getBalance);

// 2. Reseller Products & Stock List
router.get("/products", ResellerController.getProducts);

// 3. Reseller Instant Account Purchase
router.post("/buy", ResellerController.buyProduct);

export const ResellerRoutes = router;
