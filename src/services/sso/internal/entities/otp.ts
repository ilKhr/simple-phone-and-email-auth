import { IdRequired } from "../../../../utils/types";

const logSeparator = ";";

const ErrorMessages = {
  DestinationAvalibleOnlyForUnregister:
    "Destination can use only unregister otp users",
};

export type OtpWithId = IdRequired<Otp>;

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export class Otp {
  private id: string | null = null;
  private userId: string | null;
  private otp: string;
  private destination: string;
  private expiresAt: Date;

  private logger: Logger;
  private op = "email.emailService";

  constructor(params: {
    id: string | null;
    otp: string;
    userId: string | null;
    expiresAt: Date;
    destination: string; // use only for unregister users

    l: Logger;
  }) {
    this.otp = params.otp;
    this.userId = params.userId;
    this.expiresAt = params.expiresAt;
    this.destination = params.destination;

    this.logger = params.l.with(`op: ${this.op}`);
  }

  setId = (id: string) => {
    this.id = id;
  };

  getId = () => {
    return this.id;
  };

  getOtp = () => {
    return this.otp;
  };

  getUserId = () => {
    return this.userId;
  };

  getExpiresAt = () => {
    return this.expiresAt;
  };

  checkIsExpires = () => {
    return this.expiresAt < new Date();
  };

  getDestination = () => {
    const op = `.fromUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    if (this.userId) {
      logger.error(
        `err: ${ErrorMessages.DestinationAvalibleOnlyForUnregister}`
      );

      throw new Error(ErrorMessages.DestinationAvalibleOnlyForUnregister);
    }
    return this.destination;
  };
}
