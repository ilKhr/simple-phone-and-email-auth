import { Phone } from "../entities/phone";

const logSeparator = ";";

export interface Sender {
  send: (phone: string, message: string) => Promise<boolean>;
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

export interface PhoneSaver {
  save: (e: Phone) => Promise<Phone>;
}

export interface PhoneProvider {
  byPhone: (e: string) => Promise<Phone | null>;
  byPhoneAndCode: (e: string, c: string) => Promise<Phone | null>;
}

export interface PhoneRemover {
  byId: (id: string) => Promise<boolean>;
}

export const ErrorMessages = {
  InvalidPhone: "Invalid phone",
  RecordNotExists: "Record not exists",
  MessageWasNotSend: "Message was not send",
  IdNotExists: "Id not exists",
};

export class OtpCode {
  private sender: Sender;
  private codeGenerator: CodeGenerator;
  private providerMessageTexter: ProviderMessageText;
  private logger: Logger;
  private phoneSaver: PhoneSaver;
  private phoneProvider: PhoneProvider;
  private phoneRemover: PhoneRemover;

  private op = "phone.stategies.oneRedirectLink";

  constructor(
    s: Sender,
    cg: CodeGenerator,
    pmt: ProviderMessageText,
    l: Logger,
    ps: PhoneSaver,
    pp: PhoneProvider,
    pr: PhoneRemover
  ) {
    this.sender = s;
    this.codeGenerator = cg;
    this.providerMessageTexter = pmt;
    this.phoneSaver = ps;
    this.phoneProvider = pp;
    this.phoneRemover = pr;
    this.logger = l.with(`op: ${this.op}`);
  }

  public fromUs = async (e: string): Promise<boolean> => {
    const op = `.fromUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const existsRecord = await this.phoneProvider.byPhone(e);

    if (existsRecord) {
      existsRecord.deleteCode();
    }

    const phone = existsRecord || new Phone(e);

    if (!phone.checkIsPhoneValid()) {
      const msg = `err: ${ErrorMessages.InvalidPhone}`;

      logger.error(msg);

      throw new Error(ErrorMessages.InvalidPhone);
    }

    const code = await this.codeGenerator.generate();

    const message = this.providerMessageTexter.messageText(code);

    const isSent = await this.sender.send(phone.get(), message);

    if (!isSent) {
      const msg = `err: ${ErrorMessages.MessageWasNotSend}`;

      logger.error(msg);

      throw new Error(ErrorMessages.MessageWasNotSend);
    }

    phone.setCode(code);

    await this.phoneSaver.save(phone);

    return true;
  };

  public toUs = async (e: string, c: string): Promise<boolean> => {
    const op = `.toUs${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const phone = await this.phoneProvider.byPhoneAndCode(e, c);

    if (!phone) {
      logger.error(`err: ${ErrorMessages.RecordNotExists}`);

      return false;
    }

    const eid = phone.getId();

    if (!eid) {
      logger.error(`err: ${ErrorMessages.IdNotExists}`);

      throw new Error(ErrorMessages.IdNotExists);
    }

    await this.phoneRemover.byId(eid);

    return true;
  };
}
