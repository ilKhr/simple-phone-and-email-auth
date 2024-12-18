const logSeparator = ";";

interface Reciver {
  verified: (email: string) => Promise<boolean>;
}

interface Strategies {
  fromUs: (email: string) => Promise<boolean>;
  toUs: (email: string, code: string) => Promise<boolean>;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  FromUsWasFail: "From us was fail",
  EmailWasNotVerify: "Email was not verify",
};

export class EmailService {
  private reciver: Reciver;
  private strategies: Strategies;
  private logger: Logger;

  private op = "email.emailService";

  constructor(r: Reciver, s: Strategies, l: Logger) {
    this.reciver = r;
    this.strategies = s;
    this.logger = l.with(`op: ${this.op}`);
  }

  public fromUs = async (email: string): Promise<boolean> => {
    const op = `.fromUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const isComplete = await this.strategies.fromUs(email);

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
      logger.error(`err: ${ErrorMessages.EmailWasNotVerify}`);

      return false;
    }

    await this.reciver.verified(e);

    return true;
  };
}
