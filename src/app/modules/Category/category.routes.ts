import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { CategoryController } from "./category.controller";

const router = express.Router();

// Public: Get categories
router.get("/", CategoryController.getAllCategories);
router.get("/:slug", CategoryController.getCategoryBySlug);

// Admin Only: Create, Update, Delete Category Dynamically
router.post("/", auth(UserRole.ADMIN), CategoryController.createCategory);
router.patch("/:id", auth(UserRole.ADMIN), CategoryController.updateCategory);
router.delete("/:id", auth(UserRole.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;
