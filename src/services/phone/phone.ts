const logSeparator = ";";

interface Reciver {
  verified: (phone: string) => Promise<boolean>;
}

interface Strategies {
  fromUs: (phone: string) => Promise<boolean>;
  toUs: (phone: string, code: string) => Promise<boolean>;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  FromUsWasFail: "From us was fail",
  PhoneWasNotVerify: "Phone was not verify",
};

export class PhoneService {
  private reciver: Reciver;
  private strategies: Strategies;
  private logger: Logger;

  private op = "phone.phoneService";

  constructor(r: Reciver, s: Strategies, l: Logger) {
    this.reciver = r;
    this.strategies = s;
    this.logger = l.with(`op: ${this.op}`);
  }

  public fromUs = async (phone: string): Promise<boolean> => {
    const op = `.fromUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const isComplete = await this.strategies.fromUs(phone);

    if (!isComplete) {
      const msg = `err: ${ErrorMessages.FromUsWasFail}`;

      logger.error(msg);

      throw new Error(ErrorMessages.FromUsWasFail);
    }

    return true;
  };

  public toUs = async (e: string, c: string): Promise<boolean> => {
    const op = `.toUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const isVerified = await this.strategies.toUs(e, c);

    if (!isVerified) {
      logger.error(`err: ${ErrorMessages.PhoneWasNotVerify}`);

      return false;
    }

    await this.reciver.verified(e);

    return true;
  };
}
