import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { ProductService } from "./product.service";

// 1. Get All Products
const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "categoryId",
    "categorySlug",
    "isPopular",
  ]);

  const result = await ProductService.getAllProducts(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully",
    data: result,
  });
});

// 2. Get Product By ID or Slug
const getProductByIdOrSlug = catchAsync(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const result = await ProductService.getProductByIdOrSlug(idOrSlug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfully",
    data: result,
  });
});

// 3. Admin: Create Product Dynamically
const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.createProduct(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

// 4. Admin: Update Product
const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.updateProduct(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

// 5. Admin: Delete Product
const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.deleteProduct(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

// 6. Admin: Bulk Upload Stock
const bulkUploadStock = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { credentials } = req.body;

  const credentialsList = Array.isArray(credentials)
    ? credentials
    : String(credentials || "").split("\n");

  const result = await ProductService.bulkUploadStock(
    productId,
    credentialsList
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: result.message,
    data: {
      uploadedCount: result.uploadedCount,
    },
  });
});

export const ProductController = {
  getAllProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadStock,
};
