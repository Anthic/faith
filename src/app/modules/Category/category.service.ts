import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// 1. Get All Categories with product and stock count
const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    group: cat.group,
    count: cat._count.products,
  }));
};

// 2. Get Category By Slug
const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              stockItems: {
                where: { status: "AVAILABLE" },
              },
            },
          },
        },
      },
    },
  });

  if (!category) return null;

  return {
    ...category,
    products: category.products.map((p) => ({
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
      previewUid: p.previewUid,
      format: p.format,
      category: category.name,
      categoryId: category.id,
      categorySlug: category.slug,
      categoryIcon: category.icon,
    })),
  };
};

// 3. Admin: Create Category Dynamically
const createCategory = async (payload: {
  name: string;
  slug?: string;
  icon?: string;
  group?: string;
  sortOrder?: number;
}) => {
  const slug =
    payload.slug ||
    payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Category with this name/slug already exists."
    );
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      slug,
      icon: payload.icon || "/assets/icon0OWN_849d78.png",
      group: payload.group || "OTHER",
      sortOrder: payload.sortOrder || 0,
    },
  });

  return category;
};

// 4. Admin: Update Category
const updateCategory = async (
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    icon: string;
    group: string;
    sortOrder: number;
    isActive: boolean;
  }>
) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  const updated = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return updated;
};

// 5. Admin: Delete / Soft Delete Category
const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Soft delete so historical orders maintain category relation
  const deleted = await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  return deleted;
};

export const CategoryService = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
