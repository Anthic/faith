import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

export type TProductFilter = {
  searchTerm?: string;
  categoryId?: string;
  categorySlug?: string;
  isPopular?: boolean | string;
};

// 1. Get All Products with live stock count
const getAllProducts = async (filters: TProductFilter) => {
  const andConditions: Prisma.ProductWhereInput[] = [{ isActive: true }];

  if (filters.searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: filters.searchTerm, mode: "insensitive" } },
        { description: { contains: filters.searchTerm, mode: "insensitive" } },
        { nation: { contains: filters.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (filters.categoryId) {
    andConditions.push({ categoryId: filters.categoryId });
  }

  if (filters.categorySlug) {
    andConditions.push({
      category: { slug: filters.categorySlug },
    });
  }

  if (filters.isPopular !== undefined) {
    const isPopularBool =
      filters.isPopular === "true" || filters.isPopular === true;
    andConditions.push({ isPopular: isPopularBool });
  }

  const whereConditions: Prisma.ProductWhereInput = { AND: andConditions };

  const products = await prisma.product.findMany({
    where: whereConditions,
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
      _count: {
        select: {
          stockItems: {
            where: { status: "AVAILABLE" },
          },
        },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    features: p.features,
    nation: p.nation,
    nationFlag: p.nationFlag,
    price: Number(p.priceUSD),
    priceNGN: Number(p.priceNGN),
    stock: p._count.stockItems,
    isPopular: p.isPopular,
    previewUid: p.previewUid ? 1 : 0,
    format: p.format,
    warranty: p.warranty,
    category: p.category.name,
    categoryId: p.category.id,
    categorySlug: p.category.slug,
    categoryIcon: p.category.icon,
  }));
};

// 2. Get Product by ID or Slug
const getProductByIdOrSlug = async (idOrSlug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      isActive: true,
    },
    include: {
      category: true,
      _count: {
        select: {
          stockItems: {
            where: { status: "AVAILABLE" },
          },
        },
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    features: product.features,
    nation: product.nation,
    nationFlag: product.nationFlag,
    price: Number(product.priceUSD),
    priceNGN: Number(product.priceNGN),
    stock: product._count.stockItems,
    isPopular: product.isPopular,
    previewUid: product.previewUid ? 1 : 0,
    format: product.format,
    warranty: product.warranty,
    category: product.category.name,
    categoryId: product.category.id,
    categorySlug: product.category.slug,
    categoryIcon: product.category.icon,
  };
};

// 3. Admin: Create Product Dynamically
const createProduct = async (payload: {
  categoryId: string;
  title: string;
  slug?: string;
  description?: string;
  features?: string[];
  nation?: string;
  nationFlag?: string;
  priceUSD: number;
  priceNGN?: number;
  previewUid?: boolean;
  format?: string;
  warranty?: string;
  isPopular?: boolean;
}) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  const slug =
    payload.slug ||
    payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Product with this title/slug already exists."
    );
  }

  const product = await prisma.product.create({
    data: {
      categoryId: payload.categoryId,
      title: payload.title,
      slug,
      description: payload.description || "",
      features: payload.features || [],
      nation: payload.nation || "GLOBAL",
      nationFlag: payload.nationFlag || "/assets/us_5fe98e.png",
      priceUSD: payload.priceUSD,
      priceNGN: payload.priceNGN || payload.priceUSD * 1550,
      previewUid: payload.previewUid ?? false,
      format: payload.format || "UID|PASS|2FA|MAIL",
      warranty: payload.warranty || "24h warranty on first login",
      isPopular: payload.isPopular ?? false,
    },
  });

  return product;
};

// 4. Admin: Update Product
const updateProduct = async (
  id: string,
  payload: Partial<{
    categoryId: string;
    title: string;
    slug: string;
    description: string;
    features: string[];
    nation: string;
    nationFlag: string;
    priceUSD: number;
    priceNGN: number;
    previewUid: boolean;
    format: string;
    warranty: string;
    isPopular: boolean;
    isActive: boolean;
  }>
) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  const updated = await prisma.product.update({
    where: { id },
    data: payload,
  });

  return updated;
};

// 5. Admin: Delete Product (Soft delete)
const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  const deleted = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return deleted;
};

// 6. Admin: Bulk Upload Stock Items (The Vault)
const bulkUploadStock = async (
  productId: string,
  credentialsList: string[]
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Filter out empty lines
  const cleanCredentials = credentialsList
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (cleanCredentials.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No valid account lines provided");
  }

  const stockData = cleanCredentials.map((credentials) => {
    // Extract first token (UID) if available for preview
    const firstToken = credentials.split("|")[0]?.trim() || "";
    return {
      productId,
      credentials,
      previewData: firstToken,
      status: "AVAILABLE" as const,
    };
  });

  const result = await prisma.stockItem.createMany({
    data: stockData,
  });

  return {
    uploadedCount: result.count,
    message: `Successfully added ${result.count} accounts to inventory.`,
  };
};

export const ProductService = {
  getAllProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadStock,
};
