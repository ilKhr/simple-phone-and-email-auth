export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type PhoneMessage = {
  to: string;
  text: string;
};

export type PlatformsMessageTypes = {
  email: EmailMessage;
  phone: PhoneMessage;
};

export type Platforms = keyof PlatformsMessageTypes;

export type MessageTypesParams = {
  welcome: {
    name: string;
    to: string;
  };
  otp: {
    to: string;
    code: string;
  };
  verify: {
    to: string;
    code: string;
  };
};

export type MessageTypes = keyof MessageTypesParams;

type Template<T extends MessageTypes, P extends Platforms> = (
  params: MessageTypesParams[T]
) => PlatformsMessageTypes[P];

interface TemplateProvider {
  byPlatformAndType: <T extends MessageTypes, P extends Platforms>(
    platform: P,
    type: T
  ) => Template<T, P>;
}

interface GeneralParams {
  templateProvider: TemplateProvider;
}

const getMessage = <T extends MessageTypes, P extends Platforms>(
  gp: GeneralParams,
  type: T,
  platform: P
): ((params: MessageTypesParams[T]) => PlatformsMessageTypes[P]) => {
  const template = gp.templateProvider.byPlatformAndType(platform, type);

  if (!template) {
    throw new Error("Template not exist");
  }

  return template;
};

export const MessageProvider = (gp: GeneralParams) => ({
  getMessage: <T extends MessageTypes, P extends Platforms>(
    type: T,
    platform: P
  ) => getMessage(gp, type, platform),
});
