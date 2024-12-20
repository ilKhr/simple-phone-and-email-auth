import nodemailer from "nodemailer";
import { Message } from "../email";

export class Nodemailer {
  private transporter;

  constructor(params: { host: string; user: string; pass: string }) {
    this.transporter = nodemailer.createTransport({
      host: params.host,
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: params.user,
        pass: params.pass,
      },
    });
  }

  public async send(message: Message): Promise<boolean> {
    await this.transporter.sendMail(message);

    return true;
  }
}
