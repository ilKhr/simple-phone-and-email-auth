import { Otp, OtpWithId } from "../../../entities/otp";
import { UserWithId } from "../../../entities/user";

// TODO: add normal time functions
const getExpiresAt = () => new Date(new Date().getTime() + 5 * 60000);

const logSeparator = ";";

interface otpProvider {
  byOtp: (e: string) => Promise<OtpWithId | null>;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface UserProvider {
  byId: (id: string) => Promise<UserWithId | null>;
  byPhone: (phone: string) => Promise<UserWithId | null>;
}

interface Sender {
  send: (phone: string, message: string) => Promise<boolean>;
}

interface CodeGenerator {
  generate: () => Promise<string>;
}

interface ProviderMessageText {
  messageText: (code: string) => string;
}

interface OtpRemover {
  byId: (id: string) => Promise<boolean>;
}

interface OtpSaver {
  save: (otp: Otp) => Promise<OtpWithId>;
}

export interface SessionCreator {
  create: (userId: string, idAddress: string) => Promise<string>;
}

const ErrorMessages = {
  OtpNotExists: "Otp not exists",
  UserNotExists: "User not exists",
  UserPhoneNotExists: "User phone not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrOtp: "Incorrect login or otp",
  IdNotExists: "Id not exists",
  MessageWasNotSend: "Message was not send",
};

export class PhoneOtp {
  private op = "phone.stategies.phoneOtp";

  constructor(
    private otpProvider: otpProvider,
    private logger: Logger,
    private userProvider: UserProvider,
    private sender: Sender,
    private codeGenerator: CodeGenerator,
    private providerMessageTexter: ProviderMessageText,
    private otpRemover: OtpRemover,
    private otpSaver: OtpSaver,
    private sessionCreator: SessionCreator
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check otp
  async authenticate(credentials: {
    phone: string;
    code: string;
  }): Promise<string> {
    const op = `.authenticate${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const otp = await this.otpProvider.byOtp(credentials.code);

    if (!otp) {
      logger.error(`err: ${ErrorMessages.OtpNotExists}`);

      throw new Error(ErrorMessages.OtpNotExists);
    }

    const uId = otp.getUserId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const user = await this.userProvider.byId(uId);

    if (!user) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const result = credentials.phone === user.getPhone();

    if (!result) {
      logger.error(`err: ${ErrorMessages.IncorrectLoginOrOtp}`);

      throw new Error(ErrorMessages.IncorrectLoginOrOtp);
    }

    const otpId = otp.getId();

    if (!otpId) {
      logger.error(`err: ${ErrorMessages.IdNotExists}`);

      throw new Error(ErrorMessages.IdNotExists);
    }

    await this.otpRemover.byId(otpId);

    return this.sessionCreator.create(uId, " " /* TODO: add IP address */);
  }

  // send otp to phone
  async verify(credentials: { phone: string }): Promise<boolean> {
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byPhone(credentials.phone);

    if (!user) {
      const msg = `err: ${ErrorMessages.UserNotExists}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const code = await this.codeGenerator.generate();

    const message = this.providerMessageTexter.messageText(code);

    const uPhone = user.getPhone();

    if (!uPhone) {
      logger.error(`err: ${ErrorMessages.UserPhoneNotExists}`);

      throw new Error(ErrorMessages.UserPhoneNotExists);
    }

    const isSent = await this.sender.send(uPhone, message);

    if (!isSent) {
      logger.error(`err: ${ErrorMessages.MessageWasNotSend}`);

      throw new Error(ErrorMessages.MessageWasNotSend);
    }

    const uId = user.getId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserIdNotExists}`);

      throw new Error(ErrorMessages.UserIdNotExists);
    }

    const otp = new Otp({
      id: null,
      destination: credentials.phone,
      expiresAt: getExpiresAt(),
      l: this.logger,
      otp: code,
      userId: uId,
    });

    await this.otpSaver.save(otp);

    return true;
  }
}
