import bcrypt from "bcrypt";
import prisma from "../config/db.config.js";
import "dotenv/config";

import AuthMiddleware from "../middleware/AuthMiddleware.js";
import { schemaValidation } from "../validations/schemaValidation.js";
import { sendEmail } from "../config/mailer.js";
import { differenceInMinutes } from "../lib/differenceInMinutes.js";

const registerSchema = {
  title: "registration Form",
  type: "form",
  content: {
    id: {
      type: "string",
      isHidden: true,
      validations: [],
      label: "id",
      read_only: false,
    },
    name: {
      type: "string",
      isHidden: false,
      defaultValue: "Sonu",
      label: "Name",
      read_only: false,
      validations: [
        {
          type: "type",
          value: "string",
          message: "name should be string",
        },
        {
          type: "nonempty",
          value: true,
          message: "name should not be empty",
        },
        {
          type: "min",
          value: 1,
          message: "Should be greater than 4",
        },
        {
          type: "max",
          value: 10,
          message: "Should be less than 10",
        },
      ],
    },
    email: {
      type: "email",
      isHidden: false,
      label: "Email",
      read_only: false,
      validations: [
        {
          type: "type",
          value: "email",
          message: "Email should be string",
        },
        {
          type: "nonempty",
          value: true,
          message: "Email should not be empty",
        },
        {
          type: "function",
          value: "isEmail",
          message: "Not a valid email ",
        },
      ],
    },
    password: {
      type: "password",
      isHidden: false,
      label: "Password",
      read_only: false,
      validations: [
        {
          type: "type",
          value: "string",
          message: "Password should not be empty",
        },
        {
          type: "nonempty",
          value: true,
          message: "Password should not be empty",
        },
      ],
    },
    confirm_password: {
      type: "string",
      isHidden: false,
      label: "Confirm Password",
      read_only: false,
      validations: [
        {
          type: "type",
          value: "string",
          message: "Confirm Password should not be empty",
        },
        {
          type: "nonempty",
          value: true,
          message: "Confirm Password should not be empty",
        },
        {
          type: "dependant",
          value: "password",
          message: "Password is not match",
        },
      ],
    },
    created_at: {
      type: "date_and_time",
      isHidden: true,
      validations: [],
      label: "Created at",
      read_only: false,
    },
    updated_at: {
      type: "date_and_time",
      isHidden: true,
      validations: [],
      label: "Updated at",
      read_only: false,
    },
    twoFactorEnabled: {
      type: "switch",
      isHidden: true,
      validations: [
        {
          type: "type",
          value: "boolean",
          message: "Not a boolean",
          optional: true,
        },
      ],
      label: "Name",
      read_only: false,
    },
    twoFactorSecret: {
      type: "string",
      isHidden: true,
      validations: [],
      label: "Name",
      read_only: false,
    },
    posts: {
      type: "input-list-grid",
      isHidden: true,
      validations: [],
      label: "Name",
      read_only: false,
    },
  },
};

const loginSchema = {
  title: "Login Form",
  type: "form",
  content: {
    email: {
      type: "email",
      isHidden: false,
      label: "Email",
      read_only: false,
      validations: [
        {
          type: "type",
          value: "email",
          message: "Email should be string",
        },
        {
          type: "nonempty",
          value: true,
          message: "Email should not be empty",
        },
        {
          type: "function",
          value: "isEmail",
          message: "Not a valid email ",
        },
      ],
    },
    password: {
      type: "password",
      isHidden: false,
      label: "Password",
      read_only: false,
      validations: [
        {
          type: "type",
          value: "string",
          message: "Password should not be empty",
        },
        {
          type: "nonempty",
          value: true,
          message: "Password should not be empty",
        },
      ],
    },
  },
};

class AuthController {
  static async register(req, res) {
    try {
      const payload = req.body;

      const validation = schemaValidation({
        schema: registerSchema.content,
        payload,
      });

      if (validation.status === "error") {
        return res.status(400).json(validation.data);
      }

      delete payload["confirm_password"];

      const salt = bcrypt.genSaltSync(10);
      payload.password = bcrypt.hashSync(payload.password, salt);

      //Create New User Record
      const isUnique = await prisma.user.findFirst({
        where: {
          email: payload.email,
        },
      });

      if (isUnique?.id) {
        return res.status(400).json({
          type: "error",
          status: "400",
          data: [{ message: `${payload.email} is already register` }],
        });
      }

      const user = await prisma.user.create({
        data: payload,
      });

      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  }

  static async registerOption(req, res) {
    return res.status(200).json(registerSchema);
  }
  static async loginOption(req, res) {
    return res.status(200).json(loginSchema);
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const validation = schemaValidation({
        schema: loginSchema.content,
        payload: { email, password },
      });

      if (validation.status === "error") {
        return res.status(400).json(validation.data);
      }

      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        // *Check both password
        if (!bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({
            status: "success",
            status_code: 401,
            data: {
              message: "Invalid credentials",
            },
          });
        }

        if (user.twoFactorEnabled) {
          const secret = AuthMiddleware.generateTwoFactorSecret();
          await prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorSecret: "" + secret,
              twoFactorEnabled: true,
              updated_at: new Date(),
              otpTime: new Date(),
            },
          });

          console.log({ user });

          const emailResponse = await sendEmail(
            user.email,
            "OTP Verification",
            `Your email activation code is ${secret}`
          );

          if (emailResponse.accepted.length !== 0) {
            return res.json({
              status: "success",
              status_code: 200,
              data: { message: `Otp is sent to ${user.email}` },
            });
          }

          return res.status(500).json({
            status: "success",
            status_code: 500,
            data: {
              message: "Something went wrong.",
            },
          });
        }

        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
        };

        const access_token = AuthMiddleware.generateAccessToken(payload);
        const refresh_token = AuthMiddleware.generateRefreshToken(payload);

        return res.json({
          status: "success",
          status_code: 200,
          data: {
            message: "Logged in successfully!",
            access_token: access_token,
            refresh_token: refresh_token,
          },
        });
      }

      return res.status(401).json({
        status: "error",
        status_code: 401,
        data: { message: "Invalid credentials" },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        status_code: 500,
        data: { message: "Something went wrong." },
      });
    }
  }

  static async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const user = await prisma.user.findUnique({
        where: {
          email: email,
          twoFactorSecret: otp,
        },
      });

      if (user) {
        // *Check both password

        const time = differenceInMinutes(user.otpTime, new Date());

        if (time > 5) {
          return res.status(401).json({
            status: "error",
            status_code: 401,
            data: {
              message: "Otp Expired",
            },
          });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorSecret: "",
            twoFactorEnabled: true,
            updated_at: new Date(),
            otpTime: null,
          },
        });

        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
        };

        const access_token = AuthMiddleware.generateAccessToken(payload);
        const refresh_token = AuthMiddleware.generateRefreshToken(payload);

        return res.json({
          status: "success",
          status_code: 200,
          data: {
            message: "Logged in successfully!",
            access_token: access_token,
            refresh_token: refresh_token,
          },
        });
      }

      return res.status(401).json({
        status: "error",
        status_code: 401,
        data: { message: "Invalid credentials" },
      });
    } catch (error) {
      console.log({ error });
      return res.status(500).json({
        status: "error",
        status_code: 401,
        data: { message: "Something went wrong." },
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];

      const decoded_token = AuthMiddleware.decodeToken(token);

      if (decoded_token?.payload?.id) {
        const payload = {
          id: decoded_token.payload.id,
          name: decoded_token.payload.name,
          email: decoded_token.payload.email,
        };

        const access_token = AuthMiddleware.generateAccessToken(payload);
        const refresh_token = AuthMiddleware.generateRefreshToken(payload);

        return res.json({
          message: "Token generate successfully!",
          access_token: access_token,
          refresh_token: refresh_token,
        });
      }

      return res.status(401).json({
        status: "error",
        status_code: 401,
        data: { message: "Invalid token." },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        status_code: 500,
        data: { message: "Something went wrong." },
      });
    }
  }
}

export default AuthController;
