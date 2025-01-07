const logSeparator = ";";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export type Message = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface EmailSender {
  send: (message: Message) => Promise<boolean>;
}

const ErrorMessages = {
  EmailWasNotSended: "Email was not sended",
};

interface GeneralParams {
  emailSender: EmailSender;
  logger: Logger;
}

const send = async (gp: GeneralParams, message: Message): Promise<boolean> => {
  const op = `.send${logSeparator}`;
  const scopedLogger = gp.logger.with(op);

  scopedLogger.info(`mess: ${JSON.stringify(message)}`);

  const isComplete = await gp.emailSender.send(message);

  if (!isComplete) {
    const msg = `err: ${ErrorMessages.EmailWasNotSended}`;
    scopedLogger.error(msg);
    throw new Error(ErrorMessages.EmailWasNotSended);
  }

  return true;
};

export const EmailService = (gp: GeneralParams) => {
  const op = "email.emailService";
  const scopedLogger = gp.logger.with(`op: ${op}`);

  return {
    send: (message: Message) =>
      send({ emailSender: gp.emailSender, logger: scopedLogger }, message),
  };
};
