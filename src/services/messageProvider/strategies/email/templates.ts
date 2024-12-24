import {
  MessageTypes,
  MessageTypesParams,
  EmailMessage,
} from "src/services/messageProvider/messageProvider";

export const emailTemplates: {
  [T in MessageTypes]: (params: MessageTypesParams[T]) => EmailMessage;
} = {
  otp: (params: { to: string; code: string }) => ({
    // TODO: change FROM
    from: "noreply@example.com",
    to: params.to,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${params.code}`,
    html: `<h1>Your OTP code is: ${params.code}</h1>`,
  }),
  welcome: (params: { to: string; name: string }) => ({
    from: "noreply@example.com",
    to: params.to,
    subject: `Hello ${params.name}. Welcome to our service!`,
    text: "Thank you for joining us!",
    html: "<h1>Thank you for joining us!</h1>",
  }),
  verify: (params: { to: string; code: string }) => ({
    from: "noreply@example.com",
    to: params.to,
    subject: "Your OTP Code",
    // TODO: add correct confirmation link
    text: `Confirmation link: ${params.code}`,
    html: `<h1>Confirmation link: ${params.code}</h1>`,
  }),
};
