import { RedisClientType } from "redis";
import { Session } from "../../services/session/internal/entities/session";

const logSeparator = ";";

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  ip_address: string;
}

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  LastIdNotExists: "Last id not exists",
  ChangesNotExists: "ChangesNotExists",
};

export class RedisSessionRepository {
  private op = "session.storage.redisSessionRepository";
  private logger: Logger;
  private client: RedisClientType;

  constructor(client: RedisClientType, l: Logger) {
    this.client = client;
    this.logger = l.with(`op: ${this.op}`);
  }

  async save(
    session: Session
  ): Promise<Omit<Session, "getId"> & { getId: () => string }> {
    const op = `.save${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const sessionData: SessionRow = {
      id: session.getId(),
      user_id: session.getUserId(),
      expires_at: session.getExpiresAt().toISOString(),
      ip_address: session.getIpAddress(),
    };

    const key = session.getId()
      ? `session:${session.getId()}`
      : `session:${session.getUserId()}`;

    await this.client.set(key, JSON.stringify(sessionData));

    if (!session.getId()) {
      const newId = await this.client.incr("session:id:counter");
      session.setId(newId.toString());
      await this.client.rename(key, `session:${newId}`);
    }

    return session as Omit<Session, "getId"> & { getId: () => string };
  }

  async byId(id: string): Promise<Session | null> {
    const key = `session:${id}`;
    const sessionData = await this.client.get(key);
    return sessionData ? this.mapToSession(JSON.parse(sessionData)) : null;
  }

  async byUserId(userId: string): Promise<Session | null> {
    const key = `session:${userId}`;
    const sessionData = await this.client.get(key);
    return sessionData ? this.mapToSession(JSON.parse(sessionData)) : null;
  }

  async bysessionId(sessionId: string): Promise<Session | null> {
    const key = `session:${sessionId}`;
    const sessionData = await this.client.get(key);
    return sessionData ? this.mapToSession(JSON.parse(sessionData)) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const op = `.deleteById${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const key = `session:${id}`;
    const result = await this.client.del(key);

    if (result === 0) {
      logger.error(`err: ${ErrorMessages.ChangesNotExists}`);
      throw new Error(ErrorMessages.ChangesNotExists);
    }

    return result > 0;
  }

  // Convert Redis data to Session object
  private mapToSession(data: SessionRow): Session {
    const session = new Session({
      sessionId: data.accessToken,
      expiresAt: new Date(data.expiresAt),
      id: data.id,
      ipAddress: data.ipAddress,
      userId: data.userId,
    });
    session.setId(data.id);
    return session;
  }
}
