import { Email } from "../entities/email";

const logSeparator = ";";

export interface Sender {
  send: (email: string, message: string) => Promise<boolean>;
}

export interface CodeGenerator {
  generate: () => Promise<string>;
}

export interface ProviderMessageText {
  messageText: (code: string) => string;
}

export interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export interface EmailSaver {
  save: (e: Email) => Promise<Email>;
}

export interface EmailProvider {
  byEmail: (e: string) => Promise<Email | null>;
  byEmailAndCode: (e: string, c: string) => Promise<Email | null>;
}

export interface EmailRemover {
  byId: (id: string) => Promise<boolean>;
}

export const ErrorMessages = {
  InvalidEmail: "Invalid email",
  RecordNotExists: "Record not exists",
  MessageWasNotSend: "Message was not send",
  IdNotExists: "Id not exists",
};

export class OneRedirectLink {
  private sender: Sender;
  private codeGenerator: CodeGenerator;
  private providerMessageTexter: ProviderMessageText;
  private logger: Logger;
  private emailSaver: EmailSaver;
  private emailProvider: EmailProvider;
  private emailRemover: EmailRemover;

  private op = "email.stategies.oneRedirectLink";

  constructor(
    s: Sender,
    cg: CodeGenerator,
    pmt: ProviderMessageText,
    l: Logger,
    es: EmailSaver,
    ep: EmailProvider,
    er: EmailRemover
  ) {
    this.sender = s;
    this.codeGenerator = cg;
    this.providerMessageTexter = pmt;
    this.emailSaver = es;
    this.emailProvider = ep;
    this.emailRemover = er;
    this.logger = l.with(`op: ${this.op}`);
  }

  public fromUs = async (e: string): Promise<boolean> => {
    const op = `.fromUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const existsRecord = await this.emailProvider.byEmail(e);

    if (existsRecord) {
      existsRecord.deleteCode();
    }

    const email = existsRecord || new Email(e);

    if (!email.checkIsEmailValid()) {
      const msg = `err: ${ErrorMessages.InvalidEmail}`;

      logger.error(msg);

      throw new Error(ErrorMessages.InvalidEmail);
    }

    const code = await this.codeGenerator.generate();

    const message = this.providerMessageTexter.messageText(code);

    const isSent = await this.sender.send(email.get(), message);

    if (!isSent) {
      const msg = `err: ${ErrorMessages.MessageWasNotSend}`;

      logger.error(msg);

      throw new Error(ErrorMessages.MessageWasNotSend);
    }

    email.setCode(code);

    await this.emailSaver.save(email);

    return true;
  };

  public toUs = async (e: string, c: string): Promise<boolean> => {
    const op = `.toUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const email = await this.emailProvider.byEmailAndCode(e, c);

    if (!email) {
      logger.error(`err: ${ErrorMessages.RecordNotExists}`);

      return false;
    }

    const eid = email.getId();

    if (!eid) {
      logger.error(`err: ${ErrorMessages.IdNotExists}`);

      throw new Error(ErrorMessages.IdNotExists);
    }

    await this.emailRemover.byId(eid);

    return true;
  };
}
