import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

// 1. Toggle Favorite on/off
const toggleFavorite = async (userId: string, productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return {
      isFavorited: false,
      productId,
      message: "Removed from favorites",
    };
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });
    return {
      isFavorited: true,
      productId,
      message: "Added to favorites",
    };
  }
};

// 2. Get User's Favorited Products List
const getMyFavorites = async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          stockItems: {
            where: { status: "AVAILABLE" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((fav) => ({
    id: fav.id,
    productId: fav.productId,
    favoritedAt: fav.createdAt,
    product: {
      id: fav.product.id,
      title: fav.product.title,
      name: fav.product.title,
      slug: fav.product.slug,
      priceUSD: Number(fav.product.priceUSD),
      priceNGN: Number(fav.product.priceNGN),
      stock: fav.product.stockItems.length,
      category: fav.product.category,
      format: fav.product.format,
      warranty: fav.product.warranty,
    },
  }));
};

// 3. Get list of favorited Product IDs (for fast icon status)
const getMyFavoriteProductIds = async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
  });

  return favorites.map((f) => f.productId);
};

export const FavoriteService = {
  toggleFavorite,
  getMyFavorites,
  getMyFavoriteProductIds,
};
