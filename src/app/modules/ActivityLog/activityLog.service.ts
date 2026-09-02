import prisma from "../../../shared/prisma";

const getMyLogs = async (userId: string) => {
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    ipAddress: log.ipAddress || "127.0.0.1",
    userAgent: log.userAgent || "Desktop Browser",
    metadata: log.metadata,
    createdAt: log.createdAt,
  }));
};

export const ActivityLogService = {
  getMyLogs,
};
