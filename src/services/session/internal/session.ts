import { IdRequired } from "src/utils/types";
import {
  Session,
  SessionCreate,
} from "src/services/session/internal/entities/session";

export type Logger = {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
};

export type SessionSaver = {
  save: (session: Session) => Promise<IdRequired<Session>>;
};

export type SessionRemover = {
  byId: (id: string) => Promise<boolean>;
};

export type TimerExpires = {
  getExpiresAt: () => Date;
};

type SessionServiceParams = {
  logger: Logger;
  sessionCreator: SessionSaver;
  sessionRemover: SessionRemover;
  timeExpires: TimerExpires;
};

const create = async (
  params: SessionServiceParams,
  userId: number,
  ipAddress: string
): Promise<string> => {
  const session = await params.sessionCreator.save(
    SessionCreate({
      expiresAt: params.timeExpires.getExpiresAt(),
      id: null,
      ipAddress,
      userId,
    })
  );

  return session.getId();
};

const remove = async (
  params: SessionServiceParams,
  id: string
): Promise<boolean> => {
  const isRemoved = await params.sessionRemover.byId(id);

  return isRemoved;
};

export const SessionService = (params: SessionServiceParams) => {
  return {
    create: (userId: number, ipAddress: string) =>
      create(params, userId, ipAddress),
    remove: (id: string) => remove(params, id),
  };
};
