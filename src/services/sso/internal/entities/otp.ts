import { IdRequired } from "src/utils/types";

export type OtpParams = {
  id: number | null;
  otp: string;
  userId: number | null;
  expiresAt: Date;
  destination: string; // use only for unregister users
};

type OtpStruct = {
  id: number | null;
  otp: string;
  userId: number | null;
  expiresAt: Date;
  destination: string;
};

const setId = (otp: OtpStruct, newId: number) => {
  otp.id = newId;
};

const getId = (otp: OtpStruct) => otp.id;

const getOtp = (otp: OtpStruct) => otp.otp;

const getUserId = (otp: OtpStruct) => otp.userId;

const getExpiresAt = (otp: OtpStruct) => otp.expiresAt;

const checkIsExpires = (otp: OtpStruct) => otp.expiresAt < new Date();

/**
 * @description
 * Use this method only when userId is null
 */
const getDestination = (otp: OtpStruct) => otp.destination;

export const OtpCreate = (params: OtpParams) => {
  const otp: OtpStruct = {
    id: params.id,
    otp: params.otp,
    userId: params.userId,
    expiresAt: params.expiresAt,
    destination: params.destination,
  };

  return {
    setId: (newId: number) => setId(otp, newId),
    getId: () => getId(otp),
    getOtp: () => getOtp(otp),
    getUserId: () => getUserId(otp),
    getExpiresAt: () => getExpiresAt(otp),
    checkIsExpires: () => checkIsExpires(otp),
    getDestination: () => getDestination(otp),
  };
};

export type Otp = ReturnType<typeof OtpCreate>;
export type OtpWithId = IdRequired<Otp>;
