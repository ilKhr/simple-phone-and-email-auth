interface Hasher {
  hash: (p: string, saltRounds: number) => Promise<string>;
  compare: (p: string, h: string) => Promise<boolean>;
}

export class PasswordService {
  private static instance: PasswordService | null = null;

  private constructor(private hasher: Hasher) {}

  public static getInstance(hasher: Hasher): PasswordService {
    if (!PasswordService.instance) {
      PasswordService.instance = new PasswordService(hasher);
    }
    return PasswordService.instance;
  }

  public async hash(password: string): Promise<string> {
    const saltRounds = 10;
    return this.hasher.hash(password, saltRounds);
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    return this.hasher.compare(password, hash);
  }
}
