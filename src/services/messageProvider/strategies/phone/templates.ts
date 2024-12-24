import {
  MessageTypes,
  MessageTypesParams,
  PhoneMessage,
} from "src/services/messageProvider/messageProvider";

export const phoneTemplates: {
  [T in MessageTypes]: (params: MessageTypesParams[T]) => PhoneMessage;
} = {
  otp: (params: { to: string; code: string }) => ({
    to: params.to,
    text: `Your OTP code is: ${params.code}`,
  }),
  welcome: (params: { to: string; name: string }) => ({
    to: params.to,
    text: `Hello, ${params.name}. Thank you for joining us!`,
  }),
  verify: (params: { to: string; code: string }) => ({
    to: params.to,
    text: `Your OTP code is: ${params.code}`,
  }),
};
