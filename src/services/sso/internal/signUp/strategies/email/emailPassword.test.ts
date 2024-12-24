import { User } from "src/services/sso/internal/entities/user";
import { EmailPasswordSignUpStrategies } from "src/services/sso/internal/signUp/strategies/email/emailPassword";
import { ErrorMessages } from "src/services/sso/internal/sso";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("EmailPasswordSignUpStrategies", () => {
  let strategies: EmailPasswordSignUpStrategies;
  let otpProvider: any;
  let logger: any;
  let userProvider: any;
  let sender: any;
  let otpGenerator: any;
  let providerMessageTexter: any;
  let otpRemover: any;
  let otpSaver: any;
  let hasher: any;
  let userSaver: any;
  let sessionCreator: any;

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
      byEmail: vi.fn(),
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

    sessionCreator = {
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
      sessionCreator
    );
  });

  describe("register", () => {
    test("should register a UserCreate and create a session", async () => {
      const email = "test@example.com";
      const passwordHash = "hashed_password";

      const otpMock = {
        getDestination: vi.fn().mockReturnValue(email),
        checkIsExpires: vi.fn().mockReturnValue(false),
        getId: vi.fn().mockReturnValue("otp123"),
      };
      otpProvider.byOtp.mockResolvedValue(otpMock);
      userProvider.byEmail.mockResolvedValue(null);
      hasher.hash.mockResolvedValue("hashed_password");
      userSaver.save.mockResolvedValue(
        UserCreate({ id: 123, email, passwordHash, phone: null })
      );
      sessionCreator.create.mockResolvedValue("session_token");

      const result = await strategies.register({
        email,
        password: "password123",
        code: "otp_code",
      });

      expect(result).toBe("session_token");
      expect(otpRemover.byId).toHaveBeenCalledWith("otp123");
      expect(userSaver.save).toHaveBeenCalled();
      expect(sessionCreator.create).toHaveBeenCalledWith("user123", " ");
    });

    test("should throw an error if the OTP is not found", async () => {
      otpProvider.byOtp.mockResolvedValue(null);

      await expect(
        strategies.register({
          email: "test@example.com",
          password: "password123",
          code: "otp_code",
        })
      ).rejects.toThrow(ErrorMessages.OtpNotExists);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpNotExists}`
      );
    });

    test("should throw an error if the email and OTP destination do not match", async () => {
      const otpMock = {
        getDestination: vi.fn().mockReturnValue("other@example.com"),
        checkIsExpires: vi.fn(),
        getId: vi.fn(),
      };
      otpProvider.byOtp.mockResolvedValue(otpMock);

      await expect(
        strategies.register({
          email: "test@example.com",
          password: "password123",
          code: "otp_code",
        })
      ).rejects.toThrow(ErrorMessages.IncorrectLoginOrOtp);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.IncorrectLoginOrOtp}`
      );
    });

    test("should throw an error if the OTP is expired", async () => {
      const otpMock = {
        getDestination: vi.fn().mockReturnValue("test@example.com"),
        checkIsExpires: vi.fn().mockReturnValue(true),
        getId: vi.fn().mockReturnValue("otp123"),
      };
      otpProvider.byOtp.mockResolvedValue(otpMock);

      await expect(
        strategies.register({
          email: "test@example.com",
          password: "password123",
          code: "otp_code",
        })
      ).rejects.toThrow(ErrorMessages.OtpIsExpired);

      expect(otpRemover.byId).toHaveBeenCalledWith("otp123");
      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpIsExpired}`
      );
    });
  });

  describe("verify", () => {
    test("should send an OTP to the email", async () => {
      userProvider.byEmail.mockResolvedValue(null);
      otpProvider.byDestination.mockResolvedValue(null);
      otpGenerator.generate.mockResolvedValue("123456");
      providerMessageTexter.messageText.mockReturnValue({
        to: "test@example.com",
        code: "123456",
      });
      sender.send.mockResolvedValue(true);

      const result = await strategies.verify({ email: "test@example.com" });

      expect(result).toBe(true);
      expect(sender.send).toHaveBeenCalled();
      expect(otpSaver.save).toHaveBeenCalled();
    });

    test("should throw an error if the email is already in use", async () => {
      userProvider.byEmail.mockResolvedValue({ id: "user123" });

      await expect(
        strategies.verify({ email: "test@example.com" })
      ).rejects.toThrow(ErrorMessages.ThisEmailAlreadyUsed);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.ThisEmailAlreadyUsed}`
      );
    });

    test("should throw an error if the OTP is not expired and already exists", async () => {
      const otpMock = {
        checkIsExpires: vi.fn().mockReturnValue(false),
      };
      otpProvider.byDestination.mockResolvedValue(otpMock);

      await expect(
        strategies.verify({ email: "test@example.com" })
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
        strategies.verify({ email: "test@example.com" })
      ).rejects.toThrow(ErrorMessages.MessageWasNotSend);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.MessageWasNotSend}`
      );
    });
  });
});
