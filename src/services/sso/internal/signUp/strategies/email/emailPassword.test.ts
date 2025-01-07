import {
  ErrorMessages,
  EmailPasswordSignUpStrategies,
  ProviderMessageText,
  Sender,
} from "src/services/sso/internal/signUp/strategies/email/emailPassword";
import {
  Hasher,
  JwtCreator,
  Logger,
  OtpGenerator,
  OtpProvider,
  OtpRemover,
  OtpSaver,
  SessionSaver,
  UserProvider,
  UserSaver,
} from "src/services/sso/internal/types";
import { beforeEach, describe, expect, MockedObject, test, vi } from "vitest";

describe("EmailPasswordSignUpStrategies", () => {
  let strategies: EmailPasswordSignUpStrategies;
  let otpProvider: MockedObject<OtpProvider>;
  let logger: MockedObject<Logger>;
  let userProvider: MockedObject<UserProvider>;
  let sender: MockedObject<Sender>;
  let otpGenerator: MockedObject<OtpGenerator>;
  let providerMessageTexter: MockedObject<ProviderMessageText>;
  let otpRemover: MockedObject<OtpRemover>;
  let otpSaver: MockedObject<OtpSaver>;
  let hasher: MockedObject<Hasher>;
  let userSaver: MockedObject<UserSaver>;
  let sessionSaver: MockedObject<SessionSaver>;
  let jwtCreator: MockedObject<JwtCreator>;

  const basicOtpMock = {
    getDestination: vi.fn(),
    checkIsExpires: vi.fn(),
    getId: vi.fn(),
    getExpiresAt: vi.fn(),
    getOtp: vi.fn(),
    getUserId: vi.fn(),
    setId: vi.fn(),
  };

  const basicUserMock = {
    checkIsVerifiedEmail: vi.fn(),
    checkIsVerifiedPhone: vi.fn(),
    getContacts: vi.fn(),
    getEmail: vi.fn(),
    getFirstName: vi.fn(),
    getId: vi.fn(),
    getLastName: vi.fn(),
    getPasswordHash: vi.fn(),
    getPhone: vi.fn(),
    setId: vi.fn(),
    setIsVerifiedEmail: vi.fn(),
    setIsVerifiedPhone: vi.fn(),
  };

  beforeEach(() => {
    otpProvider = {
      byOtp: vi.fn(),
      byDestination: vi.fn(),
    };

    logger = {
      info: vi.fn(),
      error: vi.fn(),
      with: vi.fn().mockReturnThis(),
    };

    userProvider = {
      byId: vi.fn(),
      byEmail: vi.fn(),
      byPhone: vi.fn(),
    };

    sender = {
      send: vi.fn(),
    };

    otpGenerator = {
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

    sessionSaver = {
      save: vi.fn(),
    };

    jwtCreator = {
      create: vi.fn(),
    };

    strategies = new EmailPasswordSignUpStrategies(
      otpProvider,
      logger,
      userProvider,
      sender,
      otpGenerator,
      providerMessageTexter,
      otpRemover,
      otpSaver,
      hasher,
      userSaver,
      sessionSaver,
      jwtCreator
    );
  });

  describe("register", () => {
    test("should register a new user and create a session", async () => {
      const email = "test@test.test";
      const passwordHash = "hashed_password";

      const otpMock = {
        getDestination: vi.fn().mockReturnValue(email),
        checkIsExpires: vi.fn().mockReturnValue(false),
        getId: vi.fn().mockReturnValue("otp123"),
      };

      otpProvider.byOtp.mockResolvedValue({ ...basicOtpMock, ...otpMock });
      userProvider.byEmail.mockResolvedValue(null);
      hasher.hash.mockResolvedValue(passwordHash);
      userSaver.save.mockResolvedValue({
        ...basicUserMock,
        getId: vi.fn().mockReturnValue(123),
      });
      jwtCreator.create.mockReturnValue({
        access: {
          value: "access_token",
          expiresAt: new Date(),
        },
        refresh: {
          value: "refresh_token",
          expiresAt: new Date(),
        },
      });
      sessionSaver.save.mockResolvedValue("session_token");

      const result = await strategies.register({
        info: { firstName: "John", lastName: "Doe" },
        credentials: { email, password: "password123", code: "otp_code" },
        device: { ipAddress: "127.0.0.1" },
      });

      expect(result).toEqual({
        accessToken: "access_token",
        refreshToken: "refresh_token",
      });
      expect(otpRemover.byId).toHaveBeenCalledWith("otp123");
      expect(userSaver.save).toHaveBeenCalled();
      expect(sessionSaver.save).toHaveBeenCalledWith(
        123,
        {
          access: { value: "access_token", expiresAt: expect.any(Date) },
          refresh: { value: "refresh_token", expiresAt: expect.any(Date) },
        },
        { ipAddress: "127.0.0.1" }
      );
    });

    test("should throw an error if the OTP is not found", async () => {
      otpProvider.byOtp.mockResolvedValue(null);

      await expect(
        strategies.register({
          info: { firstName: "John", lastName: "Doe" },
          credentials: {
            email: "test@test.test",
            password: "password123",
            code: "otp_code",
          },
          device: { ipAddress: "127.0.0.1" },
        })
      ).rejects.toThrow(ErrorMessages.OtpNotExists);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpNotExists}`
      );
    });

    test("should throw an error if the email and OTP destination do not match", async () => {
      otpProvider.byOtp.mockResolvedValue({
        getDestination: vi.fn().mockReturnValue("0123456789"),
        checkIsExpires: vi.fn(),
        getId: vi.fn(),
        getExpiresAt: vi.fn(),
        getOtp: vi.fn(),
        getUserId: vi.fn(),
        setId: vi.fn(),
      });

      await expect(
        strategies.register({
          info: { firstName: "John", lastName: "Doe" },
          credentials: {
            email: "test@test.test",
            password: "password123",
            code: "otp_code",
          },
          device: { ipAddress: "127.0.0.1" },
        })
      ).rejects.toThrow(ErrorMessages.IncorrectLoginOrOtp);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.IncorrectLoginOrOtp}`
      );
    });

    test("should throw an error if the OTP is expired", async () => {
      const otpMock = {
        getDestination: vi.fn().mockReturnValue("test@test.test"),
        checkIsExpires: vi.fn().mockReturnValue(true),
        getId: vi.fn().mockReturnValue("otp123"),
      };
      otpProvider.byOtp.mockResolvedValue({ ...basicOtpMock, ...otpMock });

      await expect(
        strategies.register({
          info: { firstName: "John", lastName: "Doe" },
          credentials: {
            email: "test@test.test",
            password: "password123",
            code: "otp_code",
          },
          device: { ipAddress: "127.0.0.1" },
        })
      ).rejects.toThrow(ErrorMessages.OtpIsExpired);

      expect(otpRemover.byId).toHaveBeenCalledWith("otp123");
      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpIsExpired}`
      );
    });

    test("should throw an error if the email is already in use", async () => {
      const otpMock = {
        getDestination: vi.fn().mockReturnValue("test@test.test"),
        checkIsExpires: vi.fn().mockReturnValue(false),
        getId: vi.fn().mockReturnValue("otp123"),
      };
      otpProvider.byOtp.mockResolvedValue({ ...basicOtpMock, ...otpMock });
      userProvider.byEmail.mockResolvedValue({
        ...basicUserMock,
        getId: vi.fn().mockReturnValue(123),
      });

      await expect(
        strategies.register({
          info: { firstName: "John", lastName: "Doe" },
          credentials: {
            email: "test@test.test",
            password: "password123",
            code: "otp_code",
          },
          device: { ipAddress: "127.0.0.1" },
        })
      ).rejects.toThrow(ErrorMessages.ThisEmailAlreadyUsed);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.ThisEmailAlreadyUsed}`
      );
    });
  });

  describe("verify", () => {
    test("should send OTP to email", async () => {
      userProvider.byEmail.mockResolvedValue(null);
      otpProvider.byDestination.mockResolvedValue(null);
      otpGenerator.generate.mockResolvedValue("123456");
      providerMessageTexter.messageText.mockReturnValue({
        to: "test@test.test",
        text: "23",
        from: "test@test.test",
        html: "",
        subject: "",
      });
      sender.send.mockResolvedValue(true);

      const result = await strategies.verify({
        credentials: { email: "test@test.test" },
      });

      expect(result).toBe(true);
      expect(sender.send).toHaveBeenCalled();
      expect(otpSaver.save).toHaveBeenCalled();
    });

    test("should throw an error if the email is already in use", async () => {
      userProvider.byEmail.mockResolvedValue({
        ...basicUserMock,
        getId: vi.fn().mockReturnValue(123),
      });

      await expect(
        strategies.verify({ credentials: { email: "test@test.test" } })
      ).rejects.toThrow(ErrorMessages.ThisEmailAlreadyUsed);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.ThisEmailAlreadyUsed}`
      );
    });

    test("should throw an error if the OTP already exists and is not expired", async () => {
      const otpMock = {
        checkIsExpires: vi.fn().mockReturnValue(false),
      };
      otpProvider.byDestination.mockResolvedValue({
        ...basicOtpMock,
        ...otpMock,
      });

      await expect(
        strategies.verify({ credentials: { email: "test@test.test" } })
      ).rejects.toThrow(ErrorMessages.OtpAlreadyUsedTryLater);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpAlreadyUsedTryLater}`
      );
    });

    test("should throw an error if the message could not be sent", async () => {
      userProvider.byEmail.mockResolvedValue(null);
      otpProvider.byDestination.mockResolvedValue(null);
      otpGenerator.generate.mockResolvedValue("123456");
      sender.send.mockResolvedValue(false);

      await expect(
        strategies.verify({ credentials: { email: "test@test.test" } })
      ).rejects.toThrow(ErrorMessages.MessageWasNotSend);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.MessageWasNotSend}`
      );
    });
  });
});
