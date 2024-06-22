import { Router } from "express";
import PostController from "../controller/PostController.js";
import AuthMiddleware from "../middleware/AuthMiddleware.js";
const router = Router();

router.post("/post", AuthMiddleware.verifyAccessToken, PostController.create);
router.get("/post", AuthMiddleware.verifyAccessToken, PostController.list);
export default router;
