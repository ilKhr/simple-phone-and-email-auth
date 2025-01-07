import { Otp, OtpWithId } from "src/services/sso/internal/entities/otp";
import { User, UserWithId } from "src/services/sso/internal/entities/user";

type JwtCreatorResult = {
  access: {
    expiresAt: Date;
    value: string;
  };
  refresh: {
    expiresAt: Date;
    value: string;
  };
};

type SessionCreatorJwtParam = JwtCreatorResult;

export type AuthenticateResult = Promise<{
  accessToken: string;
  refreshToken: string;
}>;

export interface JwtCreator {
  create: (params: {
    userId: number;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string | null;
  }) => JwtCreatorResult;
}

export interface SessionSaver {
  save: (
    userId: number,
    jwt: SessionCreatorJwtParam,
    device: { ipAddress: string }
  ) => Promise<string>;
}

export interface OtpProvider {
  byOtp: (e: string) => Promise<OtpWithId | null>;
  byDestination: (e: string) => Promise<OtpWithId | null>;
}

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export interface UserProvider {
  byId: (id: number) => Promise<UserWithId | null>;
  byEmail: (email: string) => Promise<UserWithId | null>;
  byPhone: (phone: string) => Promise<UserWithId | null>;
}

export interface OtpGenerator {
  generate: () => Promise<string>;
}

export interface OtpRemover {
  byId: (id: number) => Promise<boolean>;
}

export interface OtpSaver {
  save: (otp: Otp) => Promise<OtpWithId>;
}

export interface Hasher {
  hash: (p: string) => Promise<string>;
}

export interface UserSaver {
  save: (e: User) => Promise<UserWithId>;
}
