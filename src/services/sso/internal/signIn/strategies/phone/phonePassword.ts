import { User } from "src/services/sso/internal/entities/user";
import {
  AuthenticateResult,
  JwtCreator,
  Logger,
  SessionSaver,
} from "src/services/sso/internal/types";

interface PasswordComparer {
  compare: (p: string, h: string) => Promise<boolean>;
}

interface UserProvider {
  byPhone: (e: string) => Promise<User | null>;
}

const ErrorMessages = {
  PasswordHashNotExists: "Password hash not exists",
  UserNotExists: "User not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrPassword: "Incorrect login or password",
};

export class PhonePassword {
  private op = "phone.stategies.phonePassword";

  constructor(
    private userProvider: UserProvider,
    private passwordComparer: PasswordComparer,
    private sessionSaver: SessionSaver,
    private jwtCreator: JwtCreator,

    private logger: Logger
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check valid phone and password
  async authenticate(
    credentials: {
      phone: string;
      password: string;
    },
    device: {
      ipAddress: string;
    }
  ): AuthenticateResult {
    const op = `authenticate`;
    const logger = this.logger.with(`${op}`);

    const { phone, password } = credentials;

    const user = await this.userProvider.byPhone(phone);

    if (!user) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new Error(ErrorMessages.UserNotExists);
    }

    const ph = user.getPasswordHash();

    if (!ph) {
      logger.error(`err: ${ErrorMessages.PasswordHashNotExists}`);

      throw new Error(ErrorMessages.PasswordHashNotExists);
    }

    const result = await this.passwordComparer.compare(password, ph);

    if (!result) {
      logger.error(`err: ${ErrorMessages.IncorrectLoginOrPassword}`);

      throw new Error(ErrorMessages.IncorrectLoginOrPassword);
    }

    const uId = user.getId();

    if (!uId) {
      logger.error(`err: ${ErrorMessages.UserIdNotExists}`);

      throw new Error(ErrorMessages.UserIdNotExists);
    }

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

  // check user exists
  async verify(credentials: { phone: string }): Promise<boolean> {
    const op = `verify`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byPhone(credentials.phone);

    if (!user) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new Error(ErrorMessages.UserNotExists);
    }

    return true;
  }
}
