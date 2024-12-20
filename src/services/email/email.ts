const logSeparator = ";";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export type Message = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface EmailSender {
  send: (message: Message) => Promise<boolean>;
}

const ErrorMessages = {
  EmailWasNotSended: "Email was not sended",
};

export class EmailService {
  private op = "email.emailService";

  constructor(private emailSender: EmailSender, private logger: Logger) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  public async send(message: Message): Promise<boolean> {
    const op = `.send${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    logger.info(`mess: ${message}`);

    const isComplete = await this.emailSender.send(message);

    if (!isComplete) {
      const msg = `err: ${ErrorMessages.EmailWasNotSended}`;

      logger.error(msg);

      throw new Error(ErrorMessages.EmailWasNotSended);
    }

    return true;
  }
}
