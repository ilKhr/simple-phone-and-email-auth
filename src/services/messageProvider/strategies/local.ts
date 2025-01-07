import {
  Platforms,
  Strategies,
  EmailMessage,
  PhoneMessage,
  MessageTypes,
  MessageTypesParams,
  PlatformsMessageTypes,
} from "src/services/messageProvider/messageProvider";
import { emailTemplates } from "src/services/messageProvider/strategies/email/templates";
import { phoneTemplates } from "src/services/messageProvider/strategies/phone/templates";

export type EmailTemplates = {
  [T in MessageTypes]: (params: MessageTypesParams[T]) => EmailMessage;
};

export type PhoneTemplates = {
  [T in MessageTypes]: (params: MessageTypesParams[T]) => PhoneMessage;
};

const platformTemplates: {
  [K in Platforms]: {
    [T in MessageTypes]: (
      params: MessageTypesParams[T]
    ) => PlatformsMessageTypes[K];
  };
} = {
  phone: phoneTemplates,
  email: emailTemplates,
};

const getByPlatform = <P extends Platforms>(
  platform: P
): {
  [T in MessageTypes]: (
    params: MessageTypesParams[T]
  ) => PlatformsMessageTypes[P];
} => {
  return platformTemplates[platform];
};

const getByType = <T extends MessageTypes, P extends Platforms>(
  templates: {
    [T in MessageTypes]: (
      params: MessageTypesParams[T]
    ) => PlatformsMessageTypes[P];
  },
  type: T
): ((params: MessageTypesParams[T]) => PlatformsMessageTypes[P]) => {
  return templates[type];
};

const byPlatformAndType: Strategies["byPlatformAndType"] = (platform, type) => {
  const templates = getByPlatform(platform);
  const template = getByType(templates, type);
  return template;
};

export const LocalMessageProvideStrategies = (): Strategies => ({
  byPlatformAndType,
});
