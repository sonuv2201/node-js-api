import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "kiel51@ethereal.email",
    pass: "xTYufpPhNGhHQWwtEZ",
  },
});

export const sendEmail = async (toMail, subject, body) => {
  const info = await transporter.sendMail({
    from: "sonuv.2201@gmail.com",
    to: toMail,
    cc: "kiel51@ethereal.email",
    subject: subject,
    html: body,
  });
  return info;
};
