import { UserWithId } from "../../../entities/user";

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

export interface SessionCreator {
  create: (userId: string, idAddress: string) => Promise<string>;
}

const ErrorMessages = {
  PasswordHashNotExists: "Password hash not exists",
  UserNotExists: "User not exists",
  UserIdNotExists: "User id not exists",
  IncorrectLoginOrPassword: "Incorrect login or password",
};

export class EmailPassword {
  private op = "email.stategies.emailPassword";

  constructor(
    private userProvider: UserProvider,
    private passwordComparer: PasswordComparer,
    private sessionCreator: SessionCreator,

    private logger: Logger
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // check valid email and password
  async authenticate(credentials: {
    email: string;
    password: string;
  }): Promise<string> {
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

    return this.sessionCreator.create(uId, " " /* TODO: add IP address */);
  }

  // check user exists
  async verify(credentials: { email: string }): Promise<boolean> {
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
