import { PhonePasswordSignUpStrategies } from "src/services/sso/internal/signUp/strategies/phone/phonePassword";
import { ErrorMessages } from "src/services/sso/internal/sso";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("PhonePasswordSignUpStrategies", () => {
  let otpProvider: any;
  let logger: any;
  let userProvider: any;
  let sender: any;
  let codeGenerator: any;
  let providerMessageTexter: any;
  let otpRemover: any;
  let otpSaver: any;
  let hasher: any;
  let userSaver: any;
  let sessionCreator: any;
  let strategies: PhonePasswordSignUpStrategies;

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

    strategies = new PhonePasswordSignUpStrategies(
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
    test("should throw an error if OTP does not exist", async () => {
      otpProvider.byOtp.mockResolvedValue(null);

      await expect(
        strategies.register({
          phone: "1234567890",
          password: "pass",
          code: "1234",
        })
      ).rejects.toThrow(ErrorMessages.OtpNotExists);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpNotExists}`
      );
    });

    test("should throw an error if phone does not match OTP destination", async () => {
      const mockOtp = {
        getDestination: vi.fn().mockReturnValue("0987654321"),
        checkIsExpires: vi.fn(),
        getId: vi.fn(),
      };

      otpProvider.byOtp.mockResolvedValue(mockOtp);

      await expect(
        strategies.register({
          phone: "1234567890",
          password: "pass",
          code: "1234",
        })
      ).rejects.toThrow(ErrorMessages.IncorrectLoginOrOtp);

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.IncorrectLoginOrOtp}`
      );
    });

    test("should remove expired OTP and throw an error", async () => {
      const mockOtp = {
        getDestination: vi.fn().mockReturnValue("1234567890"),
        checkIsExpires: vi.fn().mockReturnValue(true),
        getId: vi.fn().mockReturnValue("otpId"),
      };

      otpProvider.byOtp.mockResolvedValue(mockOtp);

      await expect(
        strategies.register({
          phone: "1234567890",
          password: "pass",
          code: "1234",
        })
      ).rejects.toThrow(ErrorMessages.OtpIsExpired);

      expect(otpRemover.byId).toHaveBeenCalledWith("otpId");
      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.OtpIsExpired}`
      );
    });

    test("should create a user and return a session", async () => {
      const mockOtp = {
        getDestination: vi.fn().mockReturnValue("1234567890"),
        checkIsExpires: vi.fn().mockReturnValue(false),
        getId: vi.fn().mockReturnValue("otpId"),
      };

      const mockUser = {
        getId: vi.fn().mockReturnValue("userId"),
        setIsVerifiedPhone: vi.fn(),
      };

      otpProvider.byOtp.mockResolvedValue(mockOtp);
      userProvider.byPhone.mockResolvedValue(null);
      hasher.hash.mockResolvedValue("hashedPassword");
      userSaver.save.mockResolvedValue(mockUser);
      sessionCreator.create.mockResolvedValue("sessionToken");

      const result = await strategies.register({
        phone: "1234567890",
        password: "pass",
        code: "1234",
      });

      expect(result).toBe("sessionToken");
      expect(userSaver.save).toHaveBeenCalled();
      expect(otpRemover.byId).toHaveBeenCalledWith("otpId");
    });
  });

  describe("verify", () => {
    test("should throw an error if phone is already used", async () => {
      userProvider.byPhone.mockResolvedValue({});

      await expect(strategies.verify({ phone: "1234567890" })).rejects.toThrow(
        ErrorMessages.ThisPhoneAlreadyUsed
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.ThisPhoneAlreadyUsed}`
      );
    });

    test("should send a new OTP and save it", async () => {
      otpProvider.byDestination.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue("1234");
      providerMessageTexter.messageText.mockReturnValue("Your OTP is 1234");
      sender.send.mockResolvedValue(true);

      const result = await strategies.verify({ phone: "1234567890" });

      expect(result).toBe(true);
      expect(sender.send).toHaveBeenCalledWith(
        "1234567890",
        "Your OTP is 1234"
      );
      expect(otpSaver.save).toHaveBeenCalled();
    });
  });
});
