import { PhoneTemplates } from "src/services/messageProvider/strategies/local";

export const phoneTemplates: PhoneTemplates = {
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
