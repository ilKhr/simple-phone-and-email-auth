import { EmailTemplates } from "src/services/messageProvider/strategies/local";

export const emailTemplates: EmailTemplates = {
  otp: (params) => ({
    from: params.from,
    to: params.to,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${params.code}`,
    html: `<h1>Your OTP code is: ${params.code}</h1>`,
  }),
  welcome: (params) => ({
    from: params.from,
    to: params.to,
    subject: `Hello ${params.name}. Welcome to our service!`,
    text: "Thank you for joining us!",
    html: "<h1>Thank you for joining us!</h1>",
  }),
  verify: (params) => ({
    from: params.from,
    to: params.to,
    subject: "Your OTP Code",
    // TODO: add correct confirmation link
    text: `Confirmation link: ${params.code}`,
    html: `<h1>Confirmation link: ${params.code}</h1>`,
  }),
};
