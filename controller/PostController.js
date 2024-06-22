import prisma from "../config/db.config.js";
import "dotenv/config";
class PostController {
  static async create(req, res) {
    try {
      const payload = req.body;

      const post = await prisma.post.create({
        data: payload,
      });

      return res.status(201).json(post);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  }

  static async list(req, res) {
    try {
      const post = await prisma.post.findMany({});

      return res.status(200).json(post);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  }
}

export default PostController;
