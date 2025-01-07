import { RedisClientType } from "redis";
import {
  Session,
  SessionCreate,
  SessionWithId,
} from "src/services/session/internal/entities/session";
import { checkHasId } from "src/storage/utils/checkHasId";

const logSeparator = ";";

const ErrorMessages = {
  EntityIdNotExists: "Entity id not exists",
};

type SessionRow = {
  refresh_token: string; // primary key
  access_token: string;
  user_id: number;
  refresh_expires_at: Date;
  access_expires_at: Date;
  ip_address: string;
  created_at: Date;
};

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface GeneralParams {
  redisClient: RedisClientType;
  logger: Logger;
  generatorId: { generateId: () => Promise<string> };
}

const save = async (
  gp: GeneralParams,
  session: Session
): Promise<SessionWithId> => {
  const op = `.save${logSeparator}`;
  const scopedLogger = gp.logger.with(op);

  const key = `session:${session.getRefreshTokenData().value}`;
  const sessionData: SessionRow = {
    refresh_token: session.getRefreshTokenData().value,
    access_token: session.getAccessTokenData().value,
    user_id: session.getUserId(),
    refresh_expires_at: session.getRefreshTokenData().expiresAt,
    access_expires_at: session.getAccessTokenData().expiresAt,
    ip_address: session.getIpAddress(),
    created_at: session.getCreatedAt(),
  };

  try {
    await gp.redisClient.set(key, JSON.stringify(sessionData));
    await gp.redisClient.expireAt(
      key,
      Math.floor(session.getRefreshTokenData().expiresAt.getTime() / 1000)
    );
  } catch (err) {
    scopedLogger.error(`err: Error while saving session: ${err}`);
    throw err;
  }

  return session as SessionWithId;
};

const byId = async (
  gp: GeneralParams,
  id: string
): Promise<SessionWithId | null> => {
  const op = `.byId${logSeparator}`;
  const scopedLogger = gp.logger.with(op);

  const key = `session:${id}`;
  const data = await gp.redisClient.get(key);

  if (!data) {
    return null;
  }

  try {
    const row: SessionRow = JSON.parse(data);
    return mapToSession(row);
  } catch (error) {
    scopedLogger.error(`err: Failed to parse session data: ${error}`);
    throw error;
  }
};

const deleteById = async (gp: GeneralParams, id: string): Promise<boolean> => {
  const key = `session:${id}`;
  const result = await gp.redisClient.del(key);
  return result > 0;
};

const mapToSession = (row: SessionRow): SessionWithId => {
  const session = SessionCreate({
    id: row.refresh_token,
    userId: row.user_id,
    device: {
      ipAddress: row.ip_address,
    },
    jwt: {
      access: {
        value: row.access_token,
        expiresAt: new Date(row.access_expires_at),
      },
      refresh: {
        expiresAt: new Date(row.refresh_expires_at),
        value: row.refresh_token,
      },
    },
    createdAt: new Date(row.created_at),
  });

  if (!checkHasId(session)) {
    throw new Error(ErrorMessages.EntityIdNotExists);
  }

  return session;
};

export const RedisSessionRepository = (gp: GeneralParams) => {
  return {
    save: (session: Session) => save(gp, session),
    byId: (id: string) => byId(gp, id),
    deleteById: (id: string) => deleteById(gp, id),
  };
};
