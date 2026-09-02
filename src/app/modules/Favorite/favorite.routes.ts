import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import { FavoriteController } from "./favorite.controller";

const router = express.Router();

// Toggle favorite on/off
router.post(
  "/toggle",
  auth(UserRole.USER, UserRole.ADMIN),
  FavoriteController.toggleFavorite
);

// Get my favorite products list
router.get(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  FavoriteController.getMyFavorites
);

// Get my favorite IDs
router.get(
  "/ids",
  auth(UserRole.USER, UserRole.ADMIN),
  FavoriteController.getMyFavoriteProductIds
);

export const FavoriteRoutes = router;
