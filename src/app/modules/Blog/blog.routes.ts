import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { BlogController } from "./blog.controller";

const router = express.Router();

// Public: Get all blogs
router.get("/", BlogController.getAllBlogs);

// Public: Get single blog by slug
router.get("/:slug", BlogController.getBlogBySlug);

// Admin: Create, update, delete
router.post("/", auth(UserRole.ADMIN), BlogController.createBlog);
router.patch("/:id", auth(UserRole.ADMIN), BlogController.updateBlog);
router.delete("/:id", auth(UserRole.ADMIN), BlogController.deleteBlog);

export const BlogRoutes = router;
