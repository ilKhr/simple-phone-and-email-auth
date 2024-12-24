import nodemailer from "nodemailer";
import { Message } from "src/services/email/email";

interface NodemailerParams {
  host: string;
  user: string;
  pass: string;
}

interface GeneralParams {
  nmParams: NodemailerParams;
}

const createTransporter = (gp: GeneralParams) => {
  return nodemailer.createTransport({
    host: gp.nmParams.host,
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: gp.nmParams.user,
      pass: gp.nmParams.pass,
    },
  });
};

const send = async (
  transporter: nodemailer.Transporter,
  message: Message
): Promise<boolean> => {
  await transporter.sendMail(message);
  return true;
};

export const Nodemailer = (gp: GeneralParams) => {
  const transporter = createTransporter(gp);

  return {
    send: (message: Message) => send(transporter, message),
  };
};
