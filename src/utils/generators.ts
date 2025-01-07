import { randomBytes, randomInt } from "node:crypto";

export const randomStringGenerator = () =>
  Promise.resolve(randomBytes(32).toString("hex"));

export const otpGenerator = async (): Promise<string> =>
  Promise.resolve(
    `${randomInt(0, 9)}${randomInt(0, 9)}${randomInt(0, 9)}${randomInt(
      0,
      9
    )}`.toString()
  );
