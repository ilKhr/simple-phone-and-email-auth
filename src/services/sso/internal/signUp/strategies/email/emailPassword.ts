import { EmailMessage } from "src/services/messageProvider/messageProvider";
import {
  OtpWithId,
  Otp,
  OtpCreate,
} from "src/services/sso/internal/entities/otp";
import {
  UserWithId,
  User,
  UserCreate,
} from "src/services/sso/internal/entities/user";

// TODO: add normal time functions
const getExpiresAt = () => new Date(new Date().getTime() + 5 * 60000);

const logSeparator = ";";

export interface OtpProvider {
  byOtp: (e: string) => Promise<OtpWithId | null>;
  byDestination: (e: string) => Promise<OtpWithId | null>;
}

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export interface UserProvider {
  byId: (id: number) => Promise<UserWithId | null>;
  byEmail: (email: string) => Promise<UserWithId | null>;
}

export interface Sender {
  send: (message: EmailMessage) => Promise<boolean>;
}

export interface OtpGenerator {
  generate: () => Promise<string>;
}

export interface ProviderMessageText {
  messageText: (params: { to: string; code: string }) => EmailMessage;
}

export interface OtpRemover {
  byId: (id: number) => Promise<boolean>;
}

export interface OtpSaver {
  save: (otp: Otp) => Promise<OtpWithId>;
}

export interface Hasher {
  hash: (p: string) => Promise<string>;
}

export interface UserSaver {
  save: (e: User) => Promise<UserWithId>;
}

export interface SessionCreator {
  create: (userId: number, idAddress: string) => Promise<string>;
}

export const ErrorMessages = {
  OtpAlreadyUsedTryLater: "Otp already used. Try later",
  OtpIsExpired: "Otp is expired",
  OtpNotExists: "Otp not exists",
  ThisEmailAlreadyUsed: "This email already used",
  UserEmailNotExists: "User email not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrOtp: "Incorrect login or otp",
  IdNotExists: "Id not exists",
  MessageWasNotSend: "Message was not send",
};

export class EmailPasswordSignUpStrategies {
  private op = "email.signUp.stategies.emailOtp";

  constructor(
    private otpProvider: OtpProvider,
    private logger: Logger,
    private userProvider: UserProvider,
    private sender: Sender,
    private otpGenerator: OtpGenerator,
    private providerMessageTexter: ProviderMessageText,
    private otpRemover: OtpRemover,
    private otpSaver: OtpSaver,
    private hasher: Hasher,
    private userSaver: UserSaver,
    private sessionCreator: SessionCreator
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check otp
  async register(credentials: {
    email: string;
    password: string;
    code: string;
  }): Promise<string> {
    const op = `.register${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const otp = await this.otpProvider.byOtp(credentials.code);

    if (!otp) {
      logger.error(`err: ${ErrorMessages.OtpNotExists}`);

      throw new Error(ErrorMessages.OtpNotExists);
    }

    const equalResult = credentials.email === otp.getDestination();

    if (!equalResult) {
      logger.error(`err: ${ErrorMessages.IncorrectLoginOrOtp}`);

      throw new Error(ErrorMessages.IncorrectLoginOrOtp);
    }

    const isExpiresResult = otp.checkIsExpires();

    const otpId = otp.getId();

    if (isExpiresResult) {
      await this.otpRemover.byId(otpId);

      logger.error(`err: ${ErrorMessages.OtpIsExpired}`);

      throw new Error(ErrorMessages.OtpIsExpired);
    }

    const existedUser = await this.userProvider.byEmail(credentials.email);

    if (existedUser) {
      await this.otpRemover.byId(otpId);

      logger.error(`err: ${ErrorMessages.ThisEmailAlreadyUsed}`);

      throw new Error(ErrorMessages.ThisEmailAlreadyUsed);
    }

    const localUser = UserCreate({
      phone: null,
      id: null,
      passwordHash: await this.hasher.hash(credentials.password),
      email: credentials.email,
    });

    localUser.setIsVerifiedEmail();

    const [user] = await Promise.all([
      this.userSaver.save(localUser),
      this.otpRemover.byId(otpId),
    ]);

    const uId = user.getId();

    return this.sessionCreator.create(uId, " " /* TODO: add IP address */);
  }

  // send otp to email
  async verify(credentials: { email: string }): Promise<boolean> {
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byEmail(credentials.email);

    if (user) {
      logger.error(`err: ${ErrorMessages.ThisEmailAlreadyUsed}`);

      throw new Error(ErrorMessages.ThisEmailAlreadyUsed);
    }

    const existedOtp = await this.otpProvider.byDestination(credentials.email);

    if (existedOtp && !existedOtp.checkIsExpires()) {
      logger.error(`err: ${ErrorMessages.OtpAlreadyUsedTryLater}`);

      throw new Error(ErrorMessages.OtpAlreadyUsedTryLater);
    }

    const code = await this.otpGenerator.generate();

    const message = this.providerMessageTexter.messageText({
      to: credentials.email,
      code,
    });

    const isSent = await this.sender.send(message);

    if (!isSent) {
      logger.error(`err: ${ErrorMessages.MessageWasNotSend}`);

      throw new Error(ErrorMessages.MessageWasNotSend);
    }

    const otp = OtpCreate({
      id: null,
      otp: code,
      destination: credentials.email,
      expiresAt: getExpiresAt(),
      userId: null,
    });

    if (existedOtp) {
      await this.otpRemover.byId(existedOtp.getId());
    }

    await this.otpSaver.save(otp);

    return true;
  }
}
