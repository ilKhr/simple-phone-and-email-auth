import { RedisClientType } from "redis";
import {
  Session,
  SessionWithId,
} from "../../services/session/internal/entities/session";
import { checkHasId } from "../utils/checkHasId";

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface GeneratorId {
  generateId: () => Promise<string>;
}

const ErrorMessages = {
  EntityIdNotExists: "Entity id not exists",
};

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  ip_address: string | null;
}

export class RedisSessionRepository {
  private logger: Logger;
  private redisClient: RedisClientType;
  private op = "session.storage.redisSessionRepository";

  constructor(
    redisClient: RedisClientType,
    private generatorId: GeneratorId,
    l: Logger
  ) {
    this.redisClient = redisClient;
    this.logger = l.with(`op: ${this.op}`);
  }

  async save(session: Session): Promise<SessionWithId> {
    const op = `.save;`;
    const logger = this.logger.with(op);

    if (!session.getId()) {
      const newId = await this.generatorId.generateId();
      session.setId(newId);
    }

    const key = `session:${session.getId()}`;
    const sessionData = {
      id: session.getId(),
      user_id: session.getUserId(),
      expires_at: session.getExpiresAt().toISOString(),
      ip_address: session.getIpAddress(),
    };

    try {
      await this.redisClient.set(key, JSON.stringify(sessionData));
      await this.redisClient.expireAt(
        key,
        Math.floor(session.getExpiresAt().getTime() / 1000)
      );
    } catch (err) {
      logger.error(`Error while saving session: ${err}`);
      throw err;
    }

    return session as SessionWithId;
  }

  async byId(id: string): Promise<SessionWithId | null> {
    const op = `.byId;`;
    const logger = this.logger.with(op);

    const key = `session:${id}`;
    const data = await this.redisClient.get(key);

    if (!data) {
      return null;
    }

    try {
      const row: SessionRow = JSON.parse(data);
      return this.mapToSession(row);
    } catch (error) {
      logger.error(`Failed to parse session data: ${error}`);
      throw error;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    const key = `session:${id}`;
    const result = await this.redisClient.del(key);

    return result > 0;
  }

  private mapToSession(row: SessionRow): SessionWithId {
    const session = new Session({
      id: row.id,
      userId: row.user_id,
      expiresAt: new Date(row.expires_at),
      ipAddress: row.ip_address,
    });

    if (!checkHasId(session)) {
      throw new Error(ErrorMessages.EntityIdNotExists);
    }

    return session;
  }
}
