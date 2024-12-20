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

interface TemplateProvider {
  byPlatformAndType: <T extends MessageTypes, P extends Platforms>(
    platform: P,
    type: T
  ) => Template<T, P>;
}

export type MessageTypes = keyof MessageTypesParams;

type Template<T extends MessageTypes, P extends Platforms> = (
  params: MessageTypesParams[T]
) => PlatformsMessageTypes[P];

export class MessageProvider {
  constructor(private templateProvider: TemplateProvider) {}

  getMessage<T extends MessageTypes, P extends Platforms>(
    type: T,
    platform: P
  ): (params: MessageTypesParams[T]) => PlatformsMessageTypes[P] {
    const template = this.templateProvider.byPlatformAndType(platform, type);

    if (!template) {
      throw new Error("Template not exist");
    }

    return template;
  }
}
