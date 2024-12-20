import { emailTemplates } from "./email/templates";
import {
  MessageTypes,
  MessageTypesParams,
  Platforms,
  PlatformsMessageTypes,
} from "../messageProvider";
import { phoneTemplates } from "./phone/templates";

// Strategies for get Message from RAM memory. Because we can to want take messages from network or other places
export class LocalMessageProvideStrategies {
  private platformTemplates: {
    [K in Platforms]: {
      [T in MessageTypes]: (
        params: MessageTypesParams[T]
      ) => PlatformsMessageTypes[K];
    };
  } = {
    phone: phoneTemplates,
    email: emailTemplates,
  };

  public byPlatformAndType<T extends MessageTypes, P extends Platforms>(
    platform: P,
    type: T
  ): (params: MessageTypesParams[T]) => PlatformsMessageTypes[P] {
    // return this.platformTemplates[platform][type]; get TS error

    const templates = this.getByPlatform(platform);
    const template = this.getByType(templates, type);

    return template;
  }

  private getByPlatform<P extends Platforms>(
    platform: P
  ): {
    [T in MessageTypes]: (
      params: MessageTypesParams[T]
    ) => PlatformsMessageTypes[P];
  } {
    return this.platformTemplates[platform];
  }

  private getByType<T extends MessageTypes, P extends Platforms>(
    templates: {
      [T in MessageTypes]: (
        params: MessageTypesParams[T]
      ) => PlatformsMessageTypes[P];
    },
    type: T
  ): (params: MessageTypesParams[T]) => PlatformsMessageTypes[P] {
    return templates[type];
  }
}
