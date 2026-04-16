import nodemailer, { type Transporter } from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let cachedTransporter: Transporter | null = null;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const transporter = createTransporter();

  if (transporter) {
    cachedTransporter = transporter;
  }

  return cachedTransporter;
}

export async function sendAppMail(options: MailOptions) {
  const transporter = getTransporter();

  if (!transporter) {
    return { skipped: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  return { skipped: false };
}