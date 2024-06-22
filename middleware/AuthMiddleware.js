import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

class AuthMiddleware {
  /*
  **JWT Token Handling  
  Function to generate a access token
  */
  static generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
  }

  // Function to generate a refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  }

  // Function to verify a refresh token
  static verifyRefreshToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader === undefined) {
      return res.status(401).json({ status: 401, message: "UnAuthorized" });
    }

    const token = authHeader.split(" ")[1];

    //   * Verify the JWT token
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err)
        return res.status(401).json({ status: 401, message: "UnAuthorized" });
      req.user = user;
      next();
    });
  }

  // Function to verify a access token
  static verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader === undefined) {
      return res.status(401).json({ status: 401, message: "UnAuthorized" });
    }

    const token = authHeader.split(" ")[1];

    //   * Verify the JWT token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res.status(401).json({
          status: 401,
          message:
            err.name === "TokenExpiredError" ? "Token expired" : "UnAuthorized",
        });
      req.user = user;
      next();
    });
  };

  // Function to to decode token
  static decodeToken(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      return decoded;
    } catch (err) {
      console.error("Failed to decode token:", err);
      return null;
    }
  }

  //Function to generate Two Factor Secret
  static generateTwoFactorSecret = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };
}

export default AuthMiddleware;
