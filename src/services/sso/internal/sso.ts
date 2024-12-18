const logSeparator = ";";

type Token = string;

interface EmailOtpStategy {
  authenticate: (credentials: {
    email: string;
    code: string;
  }) => Promise<Token>;

  verify: (credentials: { email: string }) => Promise<boolean>;
}

interface EmailPasswordStategy {
  authenticate: (credentials: {
    email: string;
    password: string;
  }) => Promise<Token>;

  verify: (credentials: { email: string }) => Promise<boolean>;
}

interface PhoneOtpStategy {
  authenticate: (credentials: {
    phone: string;
    code: string;
  }) => Promise<Token>;

  verify: (credentials: { phone: string }) => Promise<boolean>;
}

interface PhonePasswordStategy {
  authenticate: (credentials: {
    phone: string;
    password: string;
  }) => Promise<Token>;

  verify: (credentials: { phone: string }) => Promise<boolean>;
}

interface PhonePasswordSignUpStategy {
  register: (credentials: {
    phone: string;
    password: string;
    code: string;
  }) => Promise<Token>;

  verify: (credentials: { phone: string }) => Promise<boolean>;
}

interface EmailPasswordSignUpStategy {
  register: (credentials: {
    email: string;
    password: string;
    code: string;
  }) => Promise<Token>;

  verify: (credentials: { email: string }) => Promise<boolean>;
}

export interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

type EnableSignInStrategies =
  | EmailOtpStategy
  | PhoneOtpStategy
  | EmailPasswordStategy
  | PhonePasswordStategy;

type EnableSignUpStrategies =
  | PhonePasswordSignUpStategy
  | EmailPasswordSignUpStategy;

export const ErrorMessages = {
  UnsuporterAuthMethod: "Unsuported auth method",
};

export class SsoService {
  private signInStrategies: Record<string, EnableSignInStrategies> = {};
  private signUpStrategies: Record<string, EnableSignUpStrategies> = {};

  private logger: Logger;
  private op = "sso.ssoService";

  constructor(
    sis: Record<string, EnableSignInStrategies>,
    sus: Record<string, EnableSignUpStrategies>,
    l: Logger
  ) {
    this.signInStrategies = sis;
    this.signUpStrategies = sus;
    this.logger = l.with(`op: ${this.op}`);
  }

  public authenticate = (method: string, credentials: any): Promise<Token> => {
    const op = `.authenticate${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signInStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    return strategy.authenticate(credentials);
  };

  public verify = (method: string, credentials: any): Promise<boolean> => {
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signInStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    return strategy.verify(credentials);
  };

  public preRegister = (method: string, credentials: any): Promise<boolean> => {
    const op = `.preRegister${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signUpStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    return strategy.verify(credentials);
  };

  public register = (method: string, credentials: any): Promise<Token> => {
    const op = `.preRegister${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signUpStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    return strategy.register(credentials);
  };
}
