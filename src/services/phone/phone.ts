import { CustomError } from "src/utils/error";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export type Message = {
  to: string;
  text: string;
};

export interface PhoneSender {
  send: (message: Message) => Promise<boolean>;
}

const ErrorMessages = {
  SmsWasNotSended: "Sms was not sended",
};

export class PhoneService {
  private op = "phone.phoneService";

  constructor(private phoneSender: PhoneSender, private logger: Logger) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  public async send(message: Message): Promise<boolean> {
    const op = `send`;
    const logger = this.logger.with(`${op}`);

    logger.info(`mess: ${JSON.stringify(message)}`);

    const isComplete = await this.phoneSender.send(message);

    if (!isComplete) {
      const msg = `err: ${ErrorMessages.SmsWasNotSended}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.SmsWasNotSended);
    }

    return true;
  }
}
