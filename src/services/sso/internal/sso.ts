import { AuthenticateResult } from "src/services/sso/internal/types";
import { CustomError } from "src/utils/error";

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

export interface EmailPasswordSignInStrategy {
  authenticate: (params: {
    credentials: {
      email: string;
      password: string;
    };
    device: {
      ipAddress: string;
    };
  }) => AuthenticateResult;

  verify: (params: { credentials: { email: string } }) => Promise<boolean>;
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

export interface PhonePasswordSignUpStrategy {
  register: (params: {
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
  }) => Promise<AuthenticateResult>;

  verify: (params: { credentials: { phone: string } }) => Promise<boolean>;
}

export interface EmailPasswordSignUpStrategy {
  register: (params: {
    info: {
      firstName: string;
      lastName: string | null;
    };
    credentials: {
      email: string;
      password: string;
      code: string;
    };
    device: {
      ipAddress: string;
    };
  }) => Promise<AuthenticateResult>;

  verify: (params: { credentials: { email: string } }) => Promise<boolean>;
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
    PhonePasswordSignUpStrategy: PhonePasswordSignUpStrategy;
  };

  signIn: {
    // EmailOtpStategy: EmailOtpStrategy;
    // PhoneOtpStategy: PhoneOtpStrategy;
    EmailPasswordSignInStrategy: EmailPasswordSignInStrategy;
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
    params: Parameters<ActionToStrategies["signIn"][M]["authenticate"]>[0]
  ): AuthenticateResult => {
    const op = `authenticate`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signInStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UnsuporterAuthMethod);
    }

    return strategy.authenticate(params);
  };

  public verify = <M extends keyof ActionToStrategies["signIn"]>(
    method: M,
    params: Parameters<ActionToStrategies["signIn"][M]["verify"]>[0]
  ): Promise<boolean> => {
    const op = `verify`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signInStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UnsuporterAuthMethod);
    }

    return strategy.verify(params);
  };

  public preRegister = <M extends keyof ActionToStrategies["signUp"]>(
    method: M,
    params: Parameters<ActionToStrategies["signUp"][M]["verify"]>[0]
  ): Promise<boolean> => {
    const op = `preRegister`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signUpStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UnsuporterAuthMethod);
    }

    //@ts-ignore
    return strategy.verify(params);
  };

  public register = <M extends keyof ActionToStrategies["signUp"]>(
    method: M,
    params: Parameters<ActionToStrategies["signUp"][M]["register"]>[0]
  ): Promise<AuthenticateResult> => {
    const op = `preRegister`;
    const logger = this.logger.with(`${op}`);

    const strategy = this.signUpStrategies[method];

    if (!strategy) {
      const msg = `err: ${ErrorMessages.UnsuporterAuthMethod}`;

      logger.error(msg);

      throw new CustomError(ErrorMessages.UnsuporterAuthMethod);
    }

    //@ts-ignore
    return strategy.register(params);
  };
}
