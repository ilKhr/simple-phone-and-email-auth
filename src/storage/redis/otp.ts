import { Otp } from "../../services/sso/internal/entities/otp";

interface OtpRow {
  id: string;
  user_id: string | null;
  otp: string;
  destination: string;
  expires_at: string;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export class RedisOtpRepository {
  private logger: Logger;
  constructor(l: Logger) {
    this.logger = l;
  }

  public async save(
    otp: Otp
  ): Promise<Omit<Otp, "getId"> & { getId: () => string }> {
    return otp as unknown as Promise<
      Omit<Otp, "getId"> & { getId: () => string }
    >;
  }

  public async byId(
    id: string
  ): Promise<(Omit<Otp, "getId"> & { getId: () => string }) | null> {
    return null;
  }

  public async byOtp(
    otp: string
  ): Promise<(Omit<Otp, "getId"> & { getId: () => string }) | null> {
    return null;
  }

  public async byDestination(
    destination: string
  ): Promise<(Omit<Otp, "getId"> & { getId: () => string }) | null> {
    return null;
  }

  public async deleteById(id: string): Promise<boolean> {
    return false;
  }

  private mapToSession(row: OtpRow): Otp {
    const session = new Otp({
      id: row.id,
      destination: row.destination,
      expiresAt: new Date(row.expires_at),
      otp: row.otp,
      userId: row.user_id,

      // TODO: make normal send logger
      l: this.logger,
    });
    return session;
  }
}
