import { UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../utils/jwtHelpers";
import { comparePassword, hashPassword } from "../../../utils/passwordHelpers";

// Helper to sanitize user object
const sanitizeUser = (user: any) => {
  const { password, ...sanitized } = user;
  return sanitized;
};

// 1. User Registration
const registerUser = async (payload: {
  username: string;
  email: string;
  password: string;
}) => {
  const normalizedUsername = payload.username.trim().toLowerCase();
  const normalizedEmail = payload.email.trim().toLowerCase();

  // Check unique username
  const existingUsername = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });
  if (existingUsername) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This username is already taken. Please choose another."
    );
  }

  // Check unique email
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An account with this email address already exists."
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(payload.password);

  // Generate unique API Key for Reseller/Bot API
  const apiKey = `smv_${uuidv4().replace(/-/g, "")}`;

  // Create User
  const newUser = await prisma.user.create({
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      apiKey,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      balance: 0.0,
      currency: "USD",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: newUser.id,
      action: "REGISTER",
      metadata: { method: "web_registration" },
    },
  });

  // Generate JWT tokens
  const tokenPayload = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  };

  const accessToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(newUser),
  };
};

// 2. User Login (Accepts username OR email)
const loginUser = async (
  payload: { identifier: string; password: string },
  clientMeta?: { ipAddress?: string; userAgent?: string }
) => {
  const normalizedIdentifier = payload.identifier.trim().toLowerCase();

  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: normalizedIdentifier },
        { email: normalizedIdentifier },
      ],
    },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid username/email or password"
    );
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Your account is ${user.status.toLowerCase()}. Please contact support.`
    );
  }

  // Verify password
  const isPasswordMatch = await comparePassword(payload.password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid username/email or password"
    );
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Record login activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    },
  });

  // Generate JWT tokens
  const tokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

// 3. Get User Profile (/me)
const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      balance: true,
      currency: true,
      apiKey: true,
      ipWhitelist: true,
      telegramUsername: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  return user;
};

// 4. Change Password
const changePassword = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isPasswordMatch = await comparePassword(
    payload.oldPassword,
    user.password
  );
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Current password does not match");
  }

  const hashedPassword = await hashPassword(payload.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "PASSWORD_CHANGE",
    },
  });

  return { message: "Password updated successfully" };
};

// 5. Regenerate API Key (Developer Integration)
const regenerateApiKey = async (userId: string) => {
  const newApiKey = `smv_${uuidv4().replace(/-/g, "")}`;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { apiKey: newApiKey },
    select: {
      id: true,
      username: true,
      apiKey: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "REGENERATE_API_KEY",
    },
  });

  return {
    apiKey: updatedUser.apiKey,
    message: "New API key generated successfully",
  };
};

// 6. Update IP Whitelist
const updateIpWhitelist = async (userId: string, ips: string[]) => {
  // Sanitize IP array
  const sanitizedIps = ips
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { ipWhitelist: sanitizedIps },
    select: {
      id: true,
      username: true,
      ipWhitelist: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "UPDATE_IP_WHITELIST",
      metadata: { ips: sanitizedIps },
    },
  });

  return {
    ipWhitelist: updatedUser.ipWhitelist,
    message: "IP whitelist updated successfully",
  };
};

// 7. Refresh Access Token
const refreshToken = async (token: string) => {
  let verifiedToken: any;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verifiedToken.id },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User is no longer active");
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwtHelpers.generateToken(
    tokenPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken: newAccessToken,
  };
};

export const AuthService = {
  registerUser,
  loginUser,
  getMyProfile,
  changePassword,
  regenerateApiKey,
  updateIpWhitelist,
  refreshToken,
};
