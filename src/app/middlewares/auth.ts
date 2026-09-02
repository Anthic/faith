import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import prisma from "../../shared/prisma";
import { jwtHelpers } from "../../utils/jwtHelpers";
import { UserRole, UserStatus } from "@prisma/client";

const auth = (...roles: UserRole[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      let token = req.headers.authorization;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Authorization token is missing!");
      }

      // Handle "Bearer <token>"
      if (token.startsWith("Bearer ") || token.startsWith("bearer ")) {
        token = token.slice(7).trim();
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      ) as { id: string; email: string; username: string; role: UserRole };

      const user = await prisma.user.findUnique({
        where: {
          id: verifiedUser.id,
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User associated with token was not found!");
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Your account is ${user.status.toLowerCase()}. Please contact support.`
        );
      }

      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to access this resource!");
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

export default auth;
