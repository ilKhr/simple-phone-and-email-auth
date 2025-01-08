import { Message } from "src/services/phone/phone";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface GeneralParams {
  logger: Logger;
  isActive: boolean;
}

export const LocalSms = (gp: GeneralParams) => {
  const op = "phone.LocalSms";

  if (!gp.isActive) {
    gp.logger.info("Inactive service");

    throw new Error("Inactive service");
  }

  const scopedLogger = gp.logger.with(op);

  return {
    send: (message: Message) => {
      scopedLogger.info(`Send message: ${JSON.stringify(message)}`);

      return Promise.resolve(true);
    },
  };
};
