import { Router } from "express";
import UserController from "../controller/UserController.js";
import AuthMiddleware from "../middleware/AuthMiddleware.js";

const router = Router();

router.get(
  "/get-users",
  AuthMiddleware.verifyAccessToken,
  UserController.users
);

export default router;
