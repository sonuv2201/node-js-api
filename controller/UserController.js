import prisma from "../config/db.config.js";
import "dotenv/config";

class UserController {
  static async users(req, res) {
    try {
      const user = await prisma.user.findMany({
        include: {
          posts: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  }
}

export default UserController;
