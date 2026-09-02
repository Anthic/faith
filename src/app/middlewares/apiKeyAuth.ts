import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";
import prisma from "../../shared/prisma";
import { UserStatus } from "@prisma/client";

const apiKeyAuth = () => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      let apiKey: string | undefined = undefined;

      // Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader) {
        if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
          apiKey = authHeader.slice(7).trim();
        } else {
          apiKey = authHeader.trim();
        }
      }

      // Fallback: Check query param ?api_key=...
      if (!apiKey && req.query.api_key) {
        apiKey = String(req.query.api_key).trim();
      }

      // Fallback: Check custom header
      if (!apiKey && req.headers["x-api-key"]) {
        apiKey = String(req.headers["x-api-key"]).trim();
      }

      if (!apiKey) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "API Key is missing! Provide it via 'Authorization: Bearer <API_KEY>' or '?api_key=<API_KEY>'"
        );
      }

      const user = await prisma.user.findUnique({
        where: {
          apiKey,
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid API Key provided!");
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Your account is ${user.status.toLowerCase()}. API access is blocked.`
        );
      }

      // Check IP Whitelisting if configured
      if (user.ipWhitelist && user.ipWhitelist.length > 0) {
        const clientIp =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          req.ip ||
          "";

        // Remove IPv6 prefix ::ffff: if present
        const sanitizedIp = clientIp.replace(/^::ffff:/, "");

        const isWhitelisted = user.ipWhitelist.some(
          (whitelisted) => whitelisted.trim() === sanitizedIp
        );

        if (!isWhitelisted) {
          throw new ApiError(
            httpStatus.FORBIDDEN,
            `IP address '${sanitizedIp}' is not whitelisted for this API key.`
          );
        }
      }

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        apiKey: user.apiKey,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default apiKeyAuth;
