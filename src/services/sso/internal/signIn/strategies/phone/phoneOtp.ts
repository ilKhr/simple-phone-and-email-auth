import {
  OtpWithId,
  Otp,
  OtpCreate,
} from "src/services/sso/internal/entities/otp";
import { UserWithId } from "src/services/sso/internal/entities/user";
import {
  AuthenticateResult,
  JwtCreator,
  SessionSaver,
} from "src/services/sso/internal/types";
import { CustomError } from "src/utils/error";

// TODO: add normal time functions
const getExpiresAt = () => new Date(new Date().getTime() + 5 * 60000);

interface otpProvider {
  byOtp: (e: string) => Promise<OtpWithId | null>;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface UserProvider {
  byId: (id: number) => Promise<UserWithId | null>;
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
  byId: (id: number) => Promise<boolean>;
}

interface OtpSaver {
  save: (otp: Otp) => Promise<OtpWithId>;
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
    private sessionSaver: SessionSaver,
    private jwtCreator: JwtCreator
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check otp
  async authenticate(
    credentials: {
      phone: string;
      code: string;
    },
    device: {
      ipAddress: string;
    }
  ): AuthenticateResult {
    const op = `authenticate`;
    const logger = this.logger.with(`${op}`);

    const otp = await this.otpProvider.byOtp(credentials.code);

    if (!otp) {
      logger.error(`err: ${ErrorMessages.OtpNotExists}`);

      throw new CustomError(ErrorMessages.OtpNotExists);
    }

    const uId = otp.getUserId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new CustomError(ErrorMessages.UserNotExists);
    }

    const user = await this.userProvider.byId(uId);

    if (!user) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new CustomError(ErrorMessages.UserNotExists);
    }

    const result = credentials.phone === user.getPhone();

    if (!result) {
      logger.error(`err: ${ErrorMessages.IncorrectLoginOrOtp}`);

      throw new CustomError(ErrorMessages.IncorrectLoginOrOtp);
    }

    const otpId = otp.getId();

    if (!otpId) {
      logger.error(`err: ${ErrorMessages.IdNotExists}`);

      throw new CustomError(ErrorMessages.IdNotExists);
    }

    await this.otpRemover.byId(otpId);

    const jwt = this.jwtCreator.create({
      userId: uId,
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      email: user.getEmail(),
      phone: user.getPhone(),
    });

    await this.sessionSaver.save(uId, jwt, device);

    return { accessToken: jwt.access.value, refreshToken: jwt.refresh.value };
  }

  // send otp to phone
  async verify(credentials: { phone: string }): Promise<boolean> {
    const op = `verify`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byPhone(credentials.phone);

    if (!user) {
      const msg = `err: ${ErrorMessages.UserNotExists}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UserNotExists);
    }

    const code = await this.codeGenerator.generate();

    const message = this.providerMessageTexter.messageText(code);

    const uPhone = user.getPhone();

    if (!uPhone) {
      logger.error(`err: ${ErrorMessages.UserPhoneNotExists}`);

      throw new CustomError(ErrorMessages.UserPhoneNotExists);
    }

    const isSent = await this.sender.send(uPhone, message);

    if (!isSent) {
      logger.error(`err: ${ErrorMessages.MessageWasNotSend}`);

      throw new CustomError(ErrorMessages.MessageWasNotSend);
    }

    const uId = user.getId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserIdNotExists}`);

      throw new CustomError(ErrorMessages.UserIdNotExists);
    }

    const otp = OtpCreate({
      id: null,
      destination: credentials.phone,
      expiresAt: getExpiresAt(),
      otp: code,
      userId: uId,
    });

    await this.otpSaver.save(otp);

    return true;
  }
}
