import { IdRequired } from "src/utils/types";

export type SessionWithId = IdRequired<Session>;

export type SessionParams = {
  id: string | null;
  userId: number;
  expiresAt: Date;
  ipAddress: string | null; // TODO: Make required
};

type SessionStruct = {
  id: string | null;
  userId: number;
  expiresAt: Date;
  ipAddress: string | null;
};

const setId = (session: SessionStruct, newId: string) => {
  session.id = newId;
};

const getId = (session: SessionStruct) => session.id;

const getUserId = (session: SessionStruct) => session.userId;

const getExpiresAt = (session: SessionStruct) => session.expiresAt;

const getIpAddress = (session: SessionStruct) => session.ipAddress;

export const SessionCreate = (params: SessionParams) => {
  const session: SessionStruct = {
    id: params.id,
    userId: params.userId,
    expiresAt: params.expiresAt,
    ipAddress: params.ipAddress,
  };

  return {
    setId: (newId: string) => setId(session, newId),
    getId: () => getId(session),
    getUserId: () => getUserId(session),
    getExpiresAt: () => getExpiresAt(session),
    getIpAddress: () => getIpAddress(session),
  };
};

export type Session = ReturnType<typeof SessionCreate>;
