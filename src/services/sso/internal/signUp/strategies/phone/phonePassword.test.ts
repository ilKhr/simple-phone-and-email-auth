import { beforeEach, describe, expect, MockedObject, test, vi } from "vitest";
import { Otp } from "../../../entities/otp";
import { User } from "../../../entities/user";
import {
  CodeGenerator,
  ErrorMessages,
  Hasher,
  Logger,
  otpProvider,
  OtpRemover,
  OtpSaver,
  PhonePasswordSignUpStrategies,
  ProviderMessageText,
  Sender,
  SessionCreator,
  UserProvider,
  UserSaver,
} from "./phonePassword";

describe("PhoneOtp", () => {
  let otpProvider: MockedObject<otpProvider>;
  let logger: MockedObject<Logger>;
  let userProvider: MockedObject<UserProvider>;
  let sender: MockedObject<Sender>;
  let codeGenerator: MockedObject<CodeGenerator>;
  let providerMessageTexter: MockedObject<ProviderMessageText>;
  let otpRemover: MockedObject<OtpRemover>;
  let otpSaver: MockedObject<OtpSaver>;
  let hasher: MockedObject<Hasher>;
  let userSaver: MockedObject<UserSaver>;
  let sessionCreator: MockedObject<SessionCreator>;

  let phoneOtp: PhonePasswordSignUpStrategies;

  beforeEach(() => {
    otpProvider = {
      byOtp: vi.fn(),
      byDestination: vi.fn(),
    };
    logger = {
      error: vi.fn(),
      with: vi.fn().mockReturnThis(),
    };
    userProvider = {
      byId: vi.fn(),
      byPhone: vi.fn(),
    };
    sender = {
      send: vi.fn(),
    };
    codeGenerator = {
      generate: vi.fn(),
    };
    providerMessageTexter = {
      messageText: vi.fn(),
    };
    otpRemover = {
      byId: vi.fn(),
    };
    otpSaver = {
      save: vi.fn(),
    };
    hasher = {
      hash: vi.fn(),
    };
    userSaver = {
      save: vi.fn(),
    };
    sessionCreator = {
      create: vi.fn(),
    };

    phoneOtp = new PhonePasswordSignUpStrategies(
      otpProvider,
      logger,
      userProvider,
      sender,
      codeGenerator,
      providerMessageTexter,
      otpRemover,
      otpSaver,
      hasher,
      userSaver,
      sessionCreator
    );
  });

  describe("register", () => {
    test("should throw error if OTP does not exist", async () => {
      otpProvider.byOtp.mockResolvedValue(null);

      await expect(
        phoneOtp.register({ phone: "123", password: "pass", code: "code" })
      ).rejects.toThrow(ErrorMessages.OtpNotExists);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpNotExists}`
      );
    });

    test("should throw error if OTP is expired", async () => {
      const otpMock = {
        checkIsExpires: vi.fn(() => true),
        getId: vi.fn(() => "otp-id"),
        getDestination: vi.fn(() => "123"),
      } as unknown as Otp;

      otpProvider.byOtp.mockResolvedValue(otpMock);

      await expect(
        phoneOtp.register({ phone: "123", password: "pass", code: "code" })
      ).rejects.toThrow(ErrorMessages.OtpIsExpired);

      expect(otpRemover.byId).toHaveBeenCalledWith("otp-id");
      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpIsExpired}`
      );
    });

    test("should register user successfully", async () => {
      const otpMock = {
        checkIsExpires: vi.fn(() => false),
        getId: vi.fn(() => "otp-id"),
        getDestination: vi.fn(() => "123"),
      } as unknown as Otp;

      otpProvider.byOtp.mockResolvedValue(otpMock);
      userProvider.byPhone.mockResolvedValue(null);
      hasher.hash.mockResolvedValue("hashed-pass");
      userSaver.save.mockResolvedValue({} as User);

      const result = await phoneOtp.register({
        phone: "123",
        password: "pass",
        code: "code",
      });

      const expectedUser = new User({
        email: null,
        id: null,
        passwordHash: "hashed-pass",
        phone: "123",
      });

      expectedUser.setIsVerifiedPhone();

      expect(result).toBe(true);
      expect(userSaver.save).toHaveBeenCalledWith(expectedUser);

      expect(otpRemover.byId).toHaveBeenCalledWith("otp-id");
    });
  });

  describe("verify", () => {
    test("should throw error if phone is already used", async () => {
      userProvider.byPhone.mockResolvedValue({} as User);

      await expect(phoneOtp.verify({ phone: "123" })).rejects.toThrow(
        ErrorMessages.ThisPhoneAlreadyUsed
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.ThisPhoneAlreadyUsed}`
      );
    });

    test("should throw error if message was not sent", async () => {
      userProvider.byPhone.mockResolvedValue(null);
      otpProvider.byDestination.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue("1234");
      providerMessageTexter.messageText.mockReturnValue("Your code: 1234");
      sender.send.mockResolvedValue(false);

      await expect(phoneOtp.verify({ phone: "123" })).rejects.toThrow(
        ErrorMessages.MessageWasNotSend
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.MessageWasNotSend}`
      );
    });

    test("should verify and send OTP successfully", async () => {
      userProvider.byPhone.mockResolvedValue(null);
      otpProvider.byDestination.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue("1234");
      providerMessageTexter.messageText.mockReturnValue("Your code: 1234");
      sender.send.mockResolvedValue(true);

      const result = await phoneOtp.verify({ phone: "123" });

      expect(result).toBe(true);
      expect(sender.send).toHaveBeenCalledWith("123", "Your code: 1234");
      expect(otpSaver.save).toHaveBeenCalledWith(
        expect.objectContaining({ otp: "1234", destination: "123" })
      );
    });
  });
});
