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
  byOtp: (val: string) => Promise<OtpWithId | null>;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface UserProvider {
  byId: (id: number) => Promise<UserWithId | null>;
  byEmail: (email: string) => Promise<UserWithId | null>;
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
  byId: (id: number) => Promise<boolean>;
}

interface OtpSaver {
  save: (otp: Otp) => Promise<OtpWithId>;
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
    private sessionSaver: SessionSaver,
    private jwtCreator: JwtCreator
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check otp
  async authenticate(
    credentials: {
      email: string;
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
      const msg = `err: ${ErrorMessages.OtpNotExists}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.OtpNotExists);
    }

    const uId = otp.getUserId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new CustomError(ErrorMessages.UserNotExists);
    }

    const user = await this.userProvider.byId(uId);

    if (!user) {
      const msg = `err: ${ErrorMessages.UserNotExists}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UserNotExists);
    }

    const result = credentials.email === user.getEmail();

    if (!result) {
      const msg = `err: ${ErrorMessages.IncorrectLoginOrOtp}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.IncorrectLoginOrOtp);
    }

    await this.otpRemover.byId(otp.getId());

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

  // send otp to email
  async verify(credentials: { email: string }): Promise<boolean> {
    const op = `verify`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byEmail(credentials.email);

    if (!user) {
      const msg = `err: ${ErrorMessages.UserNotExists}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UserNotExists);
    }

    const code = await this.codeGenerator.generate();

    const message = this.providerMessageTexter.messageText(code);

    const uEmail = user.getEmail();

    if (!uEmail) {
      logger.error(`err: ${ErrorMessages.UserEmailNotExists}`);

      throw new CustomError(ErrorMessages.UserEmailNotExists);
    }

    const isSent = await this.sender.send(uEmail, message);

    if (!isSent) {
      logger.error(`err: ${ErrorMessages.MessageWasNotSend}`);

      throw new CustomError(ErrorMessages.MessageWasNotSend);
    }

    const otp = OtpCreate({
      destination: credentials.email,
      expiresAt: getExpiresAt(),
      otp: code,
      userId: user.getId(),
      id: null,
    });

    await this.otpSaver.save(otp);

    return true;
  }
}
