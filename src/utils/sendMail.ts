import nodemailer from "nodemailer";

type options = {
  email: string;
  subject: string;
  content: string;
};

export const sendMail = async (options: options) => {
  try {
    // Create a nodemailer transporter instance which is responsible to send a mail
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: options.email,
      subject: options.subject,
      text: options.content,
    });
  } catch (error: any) {
    console.error("Failed to send mail:", error.stack);
  }
};
