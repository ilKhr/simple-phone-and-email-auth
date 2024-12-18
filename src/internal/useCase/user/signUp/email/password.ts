interface SsoService {
  register: (credentials: {
    email: string;
    password: string;
    code: string;
  }) => Promise<string>;

  verify: (credentials: { email: string }) => Promise<boolean>;
}

export class SignUpEmailPassword {
  constructor(private ssoService: SsoService) {}

  public async register(credentials: {
    email: string;
    password: string;
    code: string;
  }): Promise<string> {
    const result = await this.ssoService.register(credentials);

    return result;
  }

  public async verify(credentials: { email: string }): Promise<boolean> {
    const result = await this.ssoService.verify(credentials);

    return result;
  }
}
