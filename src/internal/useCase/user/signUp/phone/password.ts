interface SsoService {
  register: (credentials: {
    phone: string;
    password: string;
    code: string;
  }) => Promise<string>;

  verify: (credentials: { phone: string }) => Promise<boolean>;
}

export class SignUpPhonePassword {
  constructor(private ssoService: SsoService) {}

  public async register(credentials: {
    phone: string;
    password: string;
    code: string;
  }): Promise<string> {
    const result = await this.ssoService.register(credentials);

    return result;
  }

  public async verify(credentials: { phone: string }): Promise<boolean> {
    const result = await this.ssoService.verify(credentials);

    return result;
  }
}
