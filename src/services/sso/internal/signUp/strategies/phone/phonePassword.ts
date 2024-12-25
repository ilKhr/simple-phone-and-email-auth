import { PhoneMessage } from "src/services/messageProvider/messageProvider";
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

export interface otpProvider {
  byOtp: (e: string) => Promise<OtpWithId | null>;
  byDestination: (e: string) => Promise<Otp | null>;
}

export interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export interface UserProvider {
  byId: (id: number) => Promise<UserWithId | null>;
  byPhone: (phone: string) => Promise<UserWithId | null>;
}

export interface Sender {
  send: (message: PhoneMessage) => Promise<boolean>;
}

export interface otpGenerator {
  generate: () => Promise<string>;
}

export interface ProviderMessageText {
  messageText: (params: { to: string; code: string }) => PhoneMessage;
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
  save: (user: User) => Promise<UserWithId>;
}

export interface SessionCreator {
  create: (userId: number, idAddress: string) => Promise<string>;
}

export interface TokenGenerator {
  generate: (u: User) => Promise<string>;
}

export interface SessionCreator {
  create: (userId: number, idAddress: string) => Promise<string>;
}

export const ErrorMessages = {
  OtpAlreadyUsedTryLater: "Otp already used. Try later",
  OtpIsExpired: "Otp is expired",
  OtpNotExists: "Otp not exists",
  ThisPhoneAlreadyUsed: "This phone already used",
  UserPhoneNotExists: "User phone not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrOtp: "Incorrect login or otp",
  IdNotExists: "Id not exists",
  MessageWasNotSend: "Message was not send",
};

export class PhonePasswordSignUpStrategies {
  private op = "phone.signUp.stategies.phoneOtp";

  constructor(
    private otpProvider: otpProvider,
    private logger: Logger,
    private userProvider: UserProvider,
    private sender: Sender,
    private otpGenerator: otpGenerator,
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
    phone: string;
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

    const equalResult = credentials.phone === otp.getDestination();

    if (!equalResult) {
      logger.error(`err: ${ErrorMessages.IncorrectLoginOrOtp}`);

      throw new Error(ErrorMessages.IncorrectLoginOrOtp);
    }

    const isExpiresResult = otp.checkIsExpires();

    const otpId = otp.getId();

    if (!otpId) {
      logger.error(`err: ${ErrorMessages.IdNotExists}`);

      throw new Error(ErrorMessages.IdNotExists);
    }

    if (isExpiresResult) {
      await this.otpRemover.byId(otpId);

      logger.error(`err: ${ErrorMessages.OtpIsExpired}`);

      throw new Error(ErrorMessages.OtpIsExpired);
    }

    const existedUser = await this.userProvider.byPhone(credentials.phone);

    if (existedUser) {
      await this.otpRemover.byId(otpId);

      logger.error(`err: ${ErrorMessages.ThisPhoneAlreadyUsed}`);

      throw new Error(ErrorMessages.ThisPhoneAlreadyUsed);
    }

    const localUser = UserCreate({
      email: null,
      id: null,
      passwordHash: await this.hasher.hash(credentials.password),
      phone: credentials.phone,
    });

    localUser.setIsVerifiedPhone();

    const [user] = await Promise.all([
      this.userSaver.save(localUser),
      this.otpRemover.byId(otpId),
    ]);

    return this.sessionCreator.create(
      user.getId(),
      " " /* TODO: add IP address */
    );
  }

  // send otp to phone
  async verify(credentials: { phone: string }): Promise<boolean> {
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byPhone(credentials.phone);

    if (user) {
      logger.error(`err: ${ErrorMessages.ThisPhoneAlreadyUsed}`);

      throw new Error(ErrorMessages.ThisPhoneAlreadyUsed);
    }

    const existedOtp = await this.otpProvider.byDestination(credentials.phone);

    if (existedOtp && !existedOtp.checkIsExpires()) {
      logger.error(`err: ${ErrorMessages.OtpAlreadyUsedTryLater}`);

      throw new Error(ErrorMessages.OtpAlreadyUsedTryLater);
    }

    const code = await this.otpGenerator.generate();

    const message = this.providerMessageTexter.messageText({
      to: credentials.phone,
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
      destination: credentials.phone,
      expiresAt: getExpiresAt(),
      userId: null,
    });

    if (existedOtp && existedOtp.getId()) {
      const eotpId = existedOtp.getId();

      if (eotpId) {
        await this.otpRemover.byId(eotpId);
      }
    }

    await this.otpSaver.save(otp);

    return true;
  }
}
