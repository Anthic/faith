import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

// 1. User Registration
router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser
);

// 2. User Login
router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser
);

// 3. User Profile
router.get(
  "/me",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthController.getMyProfile
);

// 4. Change Password
router.post(
  "/change-password",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

// 5. Regenerate API Key (For Resellers / Bots)
router.post(
  "/regenerate-api-key",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthController.regenerateApiKey
);

// 6. Whitelist IPs (For Resellers / Bots)
router.post(
  "/whitelist-ip",
  auth(UserRole.USER, UserRole.ADMIN),
  validateRequest(AuthValidation.updateIpWhitelistValidationSchema),
  AuthController.updateIpWhitelist
);

// 7. Refresh Access Token
router.get("/refresh-token", AuthController.refreshToken);

// 8. Logout
router.post(
  "/logout",
  auth(UserRole.USER, UserRole.ADMIN),
  AuthController.logOutUser
);

export const AuthRoutes = router;
