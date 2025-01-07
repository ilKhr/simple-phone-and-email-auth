import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { JwtCreator } from "src/services/sso/internal/types";

export interface JWT extends JwtCreator {}

const getAccessExpiresAt = (TTL: number): Date =>
  new Date(new Date().getTime() + TTL);
const getRefreshExpiresAt = (TTL: number): Date =>
  new Date(new Date().getTime() + TTL);

export const JwtAdapter = (config: {
  secret: string;
  access: {
    TTL: number; // ms
  };
  refresh: {
    TTL: number; // ms
  };
}): JWT => ({
  create: (data) => ({
    access: {
      expiresAt: getAccessExpiresAt(config.access.TTL),
      value: jwt.sign(data, config.secret, {}),
    },
    refresh: {
      expiresAt: getRefreshExpiresAt(config.refresh.TTL),
      value: randomUUID(),
    },
  }),
});
