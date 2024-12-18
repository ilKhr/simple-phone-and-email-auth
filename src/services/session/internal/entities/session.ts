export class Session {
  private id: string | null;
  private userId: string;
  private expiresAt: Date;
  private ipAddress: string | null; // TODO: Make required

  constructor(params: {
    id: string | null;
    userId: string;
    expiresAt: Date;
    ipAddress: string | null;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.expiresAt = params.expiresAt;
    this.ipAddress = params.ipAddress;
  }

  // Getters
  public getId(): string | null {
    return this.id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getExpiresAt(): Date {
    return this.expiresAt;
  }

  public getIpAddress(): string | null {
    return this.ipAddress;
  }

  // Setters
  public setId(id: string | null): void {
    this.id = id;
  }
}
