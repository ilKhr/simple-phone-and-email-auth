import { UserWithId } from "src/services/sso/internal/entities/user";
import { EmailPasswordSignInStrategy } from "src/services/sso/internal/sso";
import {
  AuthenticateResult,
  JwtCreator,
  SessionSaver,
} from "src/services/sso/internal/types";

const logSeparator = ";";

interface PasswordComparer {
  compare: (p: string, h: string) => Promise<boolean>;
}

interface UserProvider {
  byEmail: (user: string) => Promise<UserWithId | null>;
}

export interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  PasswordHashNotExists: "Password hash not exists",
  UserNotExists: "User not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrPassword: "Incorrect login or password",
};

export class EmailPassword implements EmailPasswordSignInStrategy {
  private op = "email.stategies.emailPassword";

  constructor(
    private userProvider: UserProvider,
    private passwordComparer: PasswordComparer,
    private sessionSaver: SessionSaver,
    private jwtCreator: JwtCreator,

    private logger: Logger
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check valid email and password
  async authenticate(params: {
    credentials: {
      email: string;
      password: string;
    };
    device: {
      ipAddress: string;
    };
  }): AuthenticateResult {
    const { credentials, device } = params;
    const op = `.authenticate${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const { email, password } = credentials;

    const user = await this.userProvider.byEmail(email);

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
  async verify(params: { credentials: { email: string } }): Promise<boolean> {
    const { credentials } = params;
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const user = await this.userProvider.byEmail(credentials.email);

    if (!user) {
      logger.error(`err: ${ErrorMessages.UserNotExists}`);

      throw new Error(ErrorMessages.UserNotExists);
    }

    return true;
  }
}
