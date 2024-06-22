import { Router } from "express";
import AuthController from "../controller/AuthController.js";
import AuthMiddleware from "../middleware/AuthMiddleware.js";

const router = Router();

router.post("/auth/register", AuthController.register);
router.get("/auth/register/configuration", AuthController.registerOption);
router.post("/auth/login", AuthController.login);
router.get("/auth/register/login/configuration", AuthController.loginOption);
router.post("/auth/verify-otp", AuthController.verifyOtp);
router.get(
  "/auth/refresh-token",
  AuthMiddleware.verifyRefreshToken,
  AuthController.refreshToken
);

export default router;
