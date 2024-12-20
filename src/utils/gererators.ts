import { getRandomValues, randomBytes } from "node:crypto";

export const randomStringGenerator = () =>
  Promise.resolve(getRandomValues(randomBytes(32)).toString());

export const otpGenerator = async (): Promise<string> =>
  Promise.resolve((await randomStringGenerator()).slice(0, 4));
