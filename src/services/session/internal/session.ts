import { Session } from "src/services/session/internal/entities/session";
import { IdRequired } from "src/utils/types";

const getExpiresAt = () => new Date(new Date().getTime() + 5 * 60000);

export interface SessionSaver {
  save: (
    session: Session
    // TODO: make generic for do it automaticly and replace everythere
  ) => Promise<IdRequired<Session>>;
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

export class SessionService {
  private op = "session.service";

  constructor(
    private sessionCreator: SessionSaver,
    private sessionRemover: SessionRemover,
    private logger: Logger
  ) {
    this.logger = logger.with(`op: ${this.op}`);
  }

  public async create(userId: number, ipAddress: string): Promise<string> {
    const op = `.create`;
    const logger = this.logger.with(`${op}`);

    if (!userId) {
      logger.error(`err: ${ErrorMessages.UserIdNotProvided}`);
      throw new Error(ErrorMessages.UserIdNotProvided);
    }

    if (!ipAddress) {
      logger.error(`err: ${ErrorMessages.IpAddressNotProvided}`);
      throw new Error(ErrorMessages.IpAddressNotProvided);
    }

    const session = await this.sessionCreator.save(
      /* TODO: replace getExpireAt */
      SessionCreate({ expiresAt: getExpiresAt(), id: null, ipAddress, userId })
    );

    return session.getId();
  }

  public async remove(id: string): Promise<boolean> {
    const op = `.remove`;
    const logger = this.logger.with(`${op}`);

    if (!id) {
      logger.error(`err: ${ErrorMessages.SessionIdNotProvided}`);
      throw new Error(ErrorMessages.SessionIdNotProvided);
    }

    const isRemoved = await this.sessionRemover.byId(id);

    if (!isRemoved) {
      logger.error(`err: ${ErrorMessages.SessionNotRemoved}`);
      throw new Error(ErrorMessages.SessionNotRemoved);
    }

    return isRemoved;
  }
}
