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
  id: string;
  user_id: number;
  expires_at: string;
  ip_address: string | null;
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

  if (!session.getId()) {
    const newId = await gp.generatorId.generateId();
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
    await gp.redisClient.set(key, JSON.stringify(sessionData));
    await gp.redisClient.expireAt(
      key,
      Math.floor(session.getExpiresAt().getTime() / 1000)
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
    id: row.id,
    userId: row.user_id,
    expiresAt: new Date(row.expires_at),
    ipAddress: row.ip_address,
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
