import { PhoneMessage } from "src/services/messageProvider/messageProvider";
import { OtpCreate } from "src/services/sso/internal/entities/otp";
import { UserCreate } from "src/services/sso/internal/entities/user";
import { PhonePasswordSignUpStrategy } from "src/services/sso/internal/sso";
import {
  AuthenticateResult,
  Hasher,
  JwtCreator,
  Logger,
  OtpGenerator,
  OtpProvider,
  OtpRemover,
  OtpSaver,
  SessionSaver,
  UserProvider,
  UserSaver,
} from "src/services/sso/internal/types";
import { CustomError } from "src/utils/error";

// TODO: add normal time functions
const getExpiresAt = () => new Date(new Date().getTime() + 5 * 60000);

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

export interface Sender {
  send: (message: PhoneMessage) => Promise<boolean>;
}
export interface ProviderMessageText {
  messageText: (params: {
    to: string;
    code: string;
    from: string;
  }) => PhoneMessage;
}

export class PhonePasswordSignUpStrategies
  implements PhonePasswordSignUpStrategy
{
  private op = "phone.signUp.stategies.phoneOtp";

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
    private sessionSaver: SessionSaver,
    private jwtCreator: JwtCreator,
    private fromEmail: string
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check otp
  async register(params: {
    info: {
      firstName: string;
      lastName: string | null;
    };
    credentials: {
      phone: string;
      password: string;
      code: string;
    };
    device: {
      ipAddress: string;
    };
  }): Promise<AuthenticateResult> {
    const { credentials, device, info } = params;
    const op = `register`;
    const logger = this.logger.with(`${op}`);

    const otp = await this.otpProvider.byOtp(credentials.code);

    if (!otp) {
      logger.error(`err: ${ErrorMessages.OtpNotExists}`);

      throw new CustomError(ErrorMessages.OtpNotExists);
    }

    const equalResult = credentials.phone === otp.getDestination();

    if (!equalResult) {
      logger.error(`err: ${ErrorMessages.IncorrectLoginOrOtp}`);

      throw new CustomError(ErrorMessages.IncorrectLoginOrOtp);
    }

    const isExpiresResult = otp.checkIsExpires();

    const otpId = otp.getId();

    if (!otpId) {
      logger.error(`err: ${ErrorMessages.IdNotExists}`);

      throw new CustomError(ErrorMessages.IdNotExists);
    }

    if (isExpiresResult) {
      await this.otpRemover.byId(otpId);

      logger.error(`err: ${ErrorMessages.OtpIsExpired}`);

      throw new CustomError(ErrorMessages.OtpIsExpired);
    }

    const existedUser = await this.userProvider.byPhone(credentials.phone);

    if (existedUser) {
      await this.otpRemover.byId(otpId);

      logger.error(`err: ${ErrorMessages.ThisPhoneAlreadyUsed}`);

      throw new CustomError(ErrorMessages.ThisPhoneAlreadyUsed);
    }

    const localUser = UserCreate({
      email: null,
      id: null,
      passwordHash: await this.hasher.hash(credentials.password),
      phone: credentials.phone,
      firstName: info.firstName,
      lastName: info.lastName,
    });

    localUser.setIsVerifiedPhone();

    const [user] = await Promise.all([
      this.userSaver.save(localUser),
      this.otpRemover.byId(otpId),
    ]);

    const uId = user.getId();

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
  async verify(params: { credentials: { phone: string } }): Promise<boolean> {
    const { credentials } = params;
    const op = `verify`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byPhone(credentials.phone);

    if (user) {
      logger.error(`err: ${ErrorMessages.ThisPhoneAlreadyUsed}`);

      throw new CustomError(ErrorMessages.ThisPhoneAlreadyUsed);
    }

    const existedOtp = await this.otpProvider.byDestination(credentials.phone);

    if (existedOtp && !existedOtp.checkIsExpires()) {
      logger.error(`err: ${ErrorMessages.OtpAlreadyUsedTryLater}`);

      throw new CustomError(ErrorMessages.OtpAlreadyUsedTryLater);
    }

    const code = await this.otpGenerator.generate();

    const message = this.providerMessageTexter.messageText({
      to: credentials.phone,
      code,
      from: this.fromEmail,
    });

    const isSent = await this.sender.send(message);

    if (!isSent) {
      logger.error(`err: ${ErrorMessages.MessageWasNotSend}`);

      throw new CustomError(ErrorMessages.MessageWasNotSend);
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
