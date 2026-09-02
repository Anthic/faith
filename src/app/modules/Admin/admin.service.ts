import prisma from "../../../shared/prisma";

const getOverviewStats = async () => {
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    availableStock,
    soldStock,
    ordersSum,
    recentOrders,
    recentUsers,
    products,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.stockItem.count({ where: { status: "AVAILABLE" } }),
    prisma.stockItem.count({ where: { status: "SOLD" } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true, email: true } },
        product: { select: { id: true, title: true } },
      },
    }),
    prisma.user.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        balance: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        stockItems: {
          where: { status: "AVAILABLE" },
          select: { id: true },
        },
      },
    }),
  ]);

  const totalRevenue = Number(ordersSum._sum.totalAmount || 0);

  const productStockSummary = products.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category.name,
    priceUSD: Number(p.priceUSD),
    stock: p.stockItems.length,
    isLowStock: p.stockItems.length < 10,
  }));

  return {
    metrics: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalUsers,
      totalProducts,
      availableStock,
      soldStock,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      user: o.user.username,
      userEmail: o.user.email,
      product: o.product.title,
      quantity: o.quantity,
      totalAmount: Number(o.totalAmount),
      couponCode: o.couponCode,
      createdAt: o.createdAt,
    })),
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      balance: Number(u.balance),
      createdAt: u.createdAt,
    })),
    products: productStockSummary,
  };
};

export const AdminService = {
  getOverviewStats,
};
