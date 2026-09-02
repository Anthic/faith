import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FavoriteService } from "./favorite.service";

// 1. Toggle Favorite
const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { productId } = req.body;
  const result = await FavoriteService.toggleFavorite(user.id, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// 2. Get My Favorites
const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await FavoriteService.getMyFavorites(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Favorites retrieved successfully",
    data: result,
  });
});

// 3. Get My Favorite IDs
const getMyFavoriteProductIds = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await FavoriteService.getMyFavoriteProductIds(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Favorite IDs retrieved successfully",
    data: result,
  });
});

export const FavoriteController = {
  toggleFavorite,
  getMyFavorites,
  getMyFavoriteProductIds,
};
