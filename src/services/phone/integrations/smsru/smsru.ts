import { errors } from "src/services/phone/integrations/smsru/errors";
import { Message } from "src/services/phone/phone";

interface Logger {
  error: (msg: string) => void;
  info: (msg: string) => void;
  with: (msg: string) => Logger;
}

interface SmsRuParams {
  api_id: string;
  isTest: boolean;
}

interface GeneralParams {
  smsRuParams: SmsRuParams;
  logger: Logger;
}

type SmsResponse = {
  status: "OK" | "ERROR";
  status_code: number;
  status_text?: string;
  sms_id?: string;
};

type ApiResponse = {
  status: "OK" | "ERROR";
  status_code: number;
  sms: {
    [phoneNumber: string]: SmsResponse;
  };
  balance: number;
};

const SuccessMessages = {
  SmsSendSuccess: "Sms send successfylly",
};

const ErrorMessages = {
  SmsNotSended: "Sms has not sended",
};

const createTransporter = (gp: GeneralParams) => {
  const op = "phone.smsru";
  const scopedLogger = gp.logger.with(op);

  const template = (to: string, msg: string) =>
    `https://sms.ru/sms/send?api_id=${
      gp.smsRuParams.api_id
    }&to=${to}&msg=${msg}&json=1${gp.smsRuParams.isTest ? "test=1" : ""}`;

  return {
    sendMessage: async (m: Message) => {
      try {
        const response = await fetch(template(m.to, m.text));
        const data: ApiResponse = await response.json();

        if (data.status === "OK") {
          Object.entries(data.sms).forEach(([_, sms]) => {
            if (sms.status === "OK") {
              scopedLogger.info(SuccessMessages.SmsSendSuccess);
            } else {
              const errorMessage =
                errors[sms.status_code as keyof typeof errors] ||
                sms.status_text;
              scopedLogger.error(
                `${ErrorMessages.SmsNotSended}: ${errorMessage}`
              );

              throw new Error(ErrorMessages.SmsNotSended);
            }
          });
        } else {
          const errorMessage =
            errors[data.status_code as keyof typeof errors] ||
            String(data.status_code);

          scopedLogger.error(`${ErrorMessages.SmsNotSended}: ${errorMessage}`);

          throw new Error(ErrorMessages.SmsNotSended);
        }
      } catch (error) {
        const errorMessage = `${ErrorMessages.SmsNotSended}: ${error}`;

        scopedLogger.error(errorMessage);
        throw new Error(ErrorMessages.SmsNotSended);
      }
    },
  };
};

const send = async (
  transporter: ReturnType<typeof createTransporter>,
  message: Message
): Promise<boolean> => {
  await transporter.sendMessage(message);
  return true;
};

export const SmsRu = (gp: GeneralParams) => {
  const transporter = createTransporter(gp);

  return {
    send: (message: Message) => send(transporter, message),
  };
};
