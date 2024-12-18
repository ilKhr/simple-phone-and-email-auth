import { Otp } from "../../../entities/otp";
import { User } from "../../../entities/user";

// TODO: add normal time functions
const getExpiresAt = () => new Date(new Date().getTime() + 5 * 60000);

const logSeparator = ";";

interface otpProvider {
  byOtp: (e: string) => Promise<Otp | null>;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface UserProvider {
  byId: (id: string) => Promise<User | null>;
  byEmail: (email: string) => Promise<User | null>;
}

interface Sender {
  send: (email: string, message: string) => Promise<boolean>;
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
  save: (otp: Otp) => Promise<Otp>;
}

interface SessionCreator {
  create: (userId: string, idAddress: string) => Promise<string>;
}

const ErrorMessages = {
  OtpNotExists: "Otp not exists",
  UserNotExists: "User not exists",
  UserEmailNotExists: "User email not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrOtp: "Incorrect login or otp",
  IdNotExists: "Id not exists",
  MessageWasNotSend: "Message was not send",
};

export class EmailOtp {
  private op = "email.stategies.emailOtp";

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
    email: string;
    code: string;
  }): Promise<string> {
    const op = `.authenticate${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const otp = await this.otpProvider.byOtp(credentials.code);

    if (!otp) {
      const msg = `err: ${ErrorMessages.OtpNotExists}`;

      logger.error(msg);

      throw new Error(ErrorMessages.OtpNotExists);
    }

    const uId = otp.getUserId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const user = await this.userProvider.byId(uId);

    if (!user) {
      const msg = `err: ${ErrorMessages.UserNotExists}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const result = credentials.email === user.getEmail();

    if (!result) {
      const msg = `err: ${ErrorMessages.IncorrectLoginOrOtp}`;

      logger.error(msg);

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

  // send otp to email
  async verify(credentials: { email: string }): Promise<boolean> {
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byEmail(credentials.email);

    if (!user) {
      const msg = `err: ${ErrorMessages.UserNotExists}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const code = await this.codeGenerator.generate();

    const message = this.providerMessageTexter.messageText(code);

    const uEmail = user.getEmail();

    if (!uEmail) {
      logger.error(`err: ${ErrorMessages.UserEmailNotExists}`);

      throw new Error(ErrorMessages.UserEmailNotExists);
    }

    const isSent = await this.sender.send(uEmail, message);

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
      destination: credentials.email,
      expiresAt: getExpiresAt(),
      l: this.logger,
      otp: code,
      userId: uId,
    });

    await this.otpSaver.save(otp);

    return true;
  }
}
