import {
  Session,
  SessionCreate,
  SessionParamsJwt,
  SessionWithId,
} from "src/services/session/internal/entities/session";

export interface SessionSaver {
  save: (session: Session) => Promise<SessionWithId>;
}

export interface SessionRemover {
  byId: (id: string) => Promise<boolean>;
}

export interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  SessionIdNotProvided: "Session ID not provided",
  UserIdNotProvided: "User ID not provided",
  IpAddressNotProvided: "IP address not provided",
  SessionNotRemoved: "Session could not be removed",
};

interface GeneralParams {
  sessionSaver: SessionSaver;
  sessionRemover: SessionRemover;
  logger: Logger;
}

const create = async (
  gp: GeneralParams,
  userId: number,
  jwt: SessionParamsJwt,
  device: {
    ipAddress: string;
  }
): Promise<string> => {
  const op = `create`;
  const scopedLogger = gp.logger.with(op);

  if (!userId) {
    scopedLogger.error(`err: ${ErrorMessages.UserIdNotProvided}`);
    throw new Error(ErrorMessages.UserIdNotProvided);
  }

  if (!device.ipAddress) {
    scopedLogger.error(`err: ${ErrorMessages.IpAddressNotProvided}`);
    throw new Error(ErrorMessages.IpAddressNotProvided);
  }

  const session = await gp.sessionSaver.save(
    SessionCreate({
      id: null,
      device,
      userId,
      jwt,
      createdAt: new Date(),
    })
  );

  return session.getId();
};

const remove = async (gp: GeneralParams, id: string): Promise<boolean> => {
  const op = `remove`;
  const scopedLogger = gp.logger.with(op);

  if (!id) {
    scopedLogger.error(`err: ${ErrorMessages.SessionIdNotProvided}`);
    throw new Error(ErrorMessages.SessionIdNotProvided);
  }

  const isRemoved = await gp.sessionRemover.byId(id);

  if (!isRemoved) {
    scopedLogger.error(`err: ${ErrorMessages.SessionNotRemoved}`);
    throw new Error(ErrorMessages.SessionNotRemoved);
  }

  return isRemoved;
};

export const SessionService = (gp: GeneralParams) => {
  const scopedLogger = gp.logger.with(`op: session.service`);

  return {
    create: (
      userId: number,
      jwt: SessionParamsJwt,
      device: { ipAddress: string }
    ) => create({ ...gp, logger: scopedLogger }, userId, jwt, device),

    remove: (id: string) => remove({ ...gp, logger: scopedLogger }, id),
  };
};
