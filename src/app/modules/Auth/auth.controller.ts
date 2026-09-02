import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

// 1. User Registration
const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  // Set refreshToken cookie
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully!",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// 2. User Login
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const clientMeta = {
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip,
    userAgent: req.headers["user-agent"],
  };

  const result = await AuthService.loginUser(req.body, clientMeta);

  // Set refreshToken cookie
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

// 3. Get Profile (/me)
const getMyProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await AuthService.getMyProfile(req.user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile retrieved successfully",
      data: result,
    });
  }
);

// 4. Change Password
const changePassword = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await AuthService.changePassword(req.user.id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

// 5. Regenerate API Key
const regenerateApiKey = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await AuthService.regenerateApiKey(req.user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: {
        apiKey: result.apiKey,
      },
    });
  }
);

// 6. Update IP Whitelist
const updateIpWhitelist = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await AuthService.updateIpWhitelist(
      req.user.id,
      req.body.ips || []
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: {
        ipWhitelist: result.ipWhitelist,
      },
    });
  }
);

// 7. Refresh Access Token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token =
    req.cookies?.refreshToken || req.headers.authorization?.replace(/^Bearer /i, "");

  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

// 8. Logout
const logOutUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  getMyProfile,
  changePassword,
  regenerateApiKey,
  updateIpWhitelist,
  refreshToken,
  logOutUser,
};
