import express, { Request, Response } from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { UserRoutes } from "../modules/User/user.routes";
import { CategoryRoutes } from "../modules/Category/category.routes";
import { ProductRoutes } from "../modules/Product/product.routes";
import { OrderRoutes } from "../modules/Order/order.routes";
import { TransactionRoutes } from "../modules/Transaction/transaction.routes";
import { WalletRoutes } from "../modules/Wallet/wallet.routes";
import { ActivityLogRoutes } from "../modules/ActivityLog/activityLog.routes";
import { FavoriteRoutes } from "../modules/Favorite/favorite.routes";
import { BlogRoutes } from "../modules/Blog/blog.routes";
import { CouponRoutes } from "../modules/Coupon/coupon.routes";
import { ResellerRoutes } from "../modules/Reseller/reseller.routes";
import { AdminRoutes } from "../modules/Admin/admin.routes";
import { seedDatabase } from "../db/seed";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/transactions",
    route: TransactionRoutes,
  },
  {
    path: "/wallet",
    route: WalletRoutes,
  },
  {
    path: "/logs",
    route: ActivityLogRoutes,
  },
  {
    path: "/favorites",
    route: FavoriteRoutes,
  },
  {
    path: "/blogs",
    route: BlogRoutes,
  },
  {
    path: "/coupons",
    route: CouponRoutes,
  },
  {
    path: "/reseller",
    route: ResellerRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

// One-click Catalog Seeder route
router.post(
  "/seed",
  catchAsync(async (req: Request, res: Response) => {
    const result = await seedDatabase();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  })
);

export default router;
