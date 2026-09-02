import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { ProductController } from "./product.controller";

const router = express.Router();

// Public: Get all products
router.get("/", ProductController.getAllProducts);

// Public: Get single product by id or slug
router.get("/:idOrSlug", ProductController.getProductByIdOrSlug);

// Admin: Dynamically create, update, delete products
router.post("/", auth(UserRole.ADMIN), ProductController.createProduct);
router.patch("/:id", auth(UserRole.ADMIN), ProductController.updateProduct);
router.delete("/:id", auth(UserRole.ADMIN), ProductController.deleteProduct);

// Admin: Bulk upload stock accounts
router.post(
  "/:productId/stock",
  auth(UserRole.ADMIN),
  ProductController.bulkUploadStock
);

export const ProductRoutes = router;
