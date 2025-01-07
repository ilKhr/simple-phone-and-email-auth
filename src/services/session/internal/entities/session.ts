import { IdRequired } from "src/utils/types";

export type SessionWithId = IdRequired<Session>;

type SessionStructJwt = {
  access: {
    expiresAt: Date;
    value: string;
  };
  refresh: {
    expiresAt: Date;
    value: string;
  };
};

export type SessionParamsJwt = SessionStructJwt;

type SessionStruct = {
  id: string | null;
  userId: number;
  jwt: SessionStructJwt;
  device: {
    ipAddress: string;
  };
  createdAt: Date;
};

type SessionParams = SessionStruct;

const setId = (session: SessionStruct, newId: string) => {
  session.id = newId;
};

const getId = (session: SessionStruct) => session.id;

const getUserId = (session: SessionStruct) => session.userId;

const getIpAddress = (session: SessionStruct) => session.device.ipAddress;

const getRefreshTokenData = (session: SessionStruct) => session.jwt.refresh;
const getAccessTokenData = (session: SessionStruct) => session.jwt.refresh;

const getCreatedAt = (session: SessionStruct) => session.createdAt;

export const SessionCreate = (params: SessionParams) => {
  const session: SessionStruct = {
    id: params.id,
    userId: params.userId,
    jwt: params.jwt,
    device: params.device,
    createdAt: params.createdAt,
  };

  return {
    setId: (newId: string) => setId(session, newId),
    getId: () => getId(session),
    getUserId: () => getUserId(session),
    getIpAddress: () => getIpAddress(session),
    getRefreshTokenData: () => getRefreshTokenData(session),
    getAccessTokenData: () => getAccessTokenData(session),
    getCreatedAt: () => getCreatedAt(session),
  };
};

export type Session = ReturnType<typeof SessionCreate>;
