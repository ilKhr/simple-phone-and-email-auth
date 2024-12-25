const logSeparator = ";";

type Token = string;

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

// interface EmailOtpStrategy {
//   authenticate: (credentials: {
//     email: string;
//     code: string;
//   }) => Promise<Token>;

//   verify: (credentials: { email: string }) => Promise<boolean>;
// }

interface EmailPasswordStrategy {
  authenticate: (credentials: {
    email: string;
    password: string;
  }) => Promise<Token>;

  verify: (credentials: { email: string }) => Promise<boolean>;
}

// interface PhoneOtpStrategy {
//   authenticate: (credentials: {
//     phone: string;
//     code: string;
//   }) => Promise<Token>;

//   verify: (credentials: { phone: string }) => Promise<boolean>;
// }

// interface PhonePasswordStrategy {
//   authenticate: (credentials: {
//     phone: string;
//     password: string;
//   }) => Promise<Token>;

//   verify: (credentials: { phone: string }) => Promise<boolean>;
// }

// interface PhonePasswordSignUpStrategy {
//   register: (credentials: {
//     phone: string;
//     password: string;
//     code: string;
//   }) => Promise<Token>;

//   verify: (credentials: { phone: string }) => Promise<boolean>;
// }

interface EmailPasswordSignUpStrategy {
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

export const ErrorMessages = {
  UnsuporterAuthMethod: "Unsuported auth method",
};

type ActionToStrategies = {
  signUp: {
    EmailPasswordSignUpStrategy: EmailPasswordSignUpStrategy;
    // PhonePasswordSignUpStrategy: PhonePasswordSignUpStrategy;
  };

  signIn: {
    // EmailOtpStategy: EmailOtpStrategy;
    // PhoneOtpStategy: PhoneOtpStrategy;
    EmailPasswordStategy: EmailPasswordStrategy;
    // PhonePasswordStategy: PhonePasswordStrategy;
  };
};

export class SsoService {
  private op = "sso.ssoService";

  constructor(
    private signInStrategies: ActionToStrategies["signIn"],
    private signUpStrategies: ActionToStrategies["signUp"],
    private logger: Logger
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  // TODO: replace any to normal types
  public authenticate = <M extends keyof ActionToStrategies["signIn"]>(
    method: M,
    credentials: Parameters<ActionToStrategies["signIn"][M]["authenticate"]>[0]
  ): Promise<Token> => {
    const op = `.authenticate${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signInStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    //@ts-ignore
    return strategy.authenticate(credentials);
  };

  public verify = <M extends keyof ActionToStrategies["signIn"]>(
    method: M,
    credentials: Parameters<ActionToStrategies["signIn"][M]["verify"]>[0]
  ): Promise<boolean> => {
    const op = `.verify${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signInStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    //@ts-ignore
    return strategy.verify(credentials);
  };

  public preRegister = <M extends keyof ActionToStrategies["signUp"]>(
    method: M,
    credentials: Parameters<ActionToStrategies["signUp"][M]["verify"]>[0]
  ): Promise<boolean> => {
    const op = `.preRegister${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signUpStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    //@ts-ignore
    return strategy.verify(credentials);
  };

  public register = <M extends keyof ActionToStrategies["signUp"]>(
    method: M,
    credentials: Parameters<ActionToStrategies["signUp"][M]["register"]>[0]
  ): Promise<Token> => {
    const op = `.preRegister${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signUpStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new Error(ErrorMessages.UnsuporterAuthMethod);
    }

    //@ts-ignore
    return strategy.register(credentials);
  };
}
