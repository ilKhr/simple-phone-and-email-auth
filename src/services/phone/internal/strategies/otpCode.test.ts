import { vi, describe, beforeEach, expect, test, MockedObject } from "vitest";
import {
  CodeGenerator,
  OtpCode,
  PhoneProvider,
  PhoneRemover,
  PhoneSaver,
  ProviderMessageText,
  Sender,
  Logger,
  ErrorMessages,
} from "./otpCode";
import { Phone } from "../entities/phone";

describe("OneRedirectLink", () => {
  let sender: MockedObject<Sender>;
  let codeGenerator: MockedObject<CodeGenerator>;
  let providerMessageTexter: MockedObject<ProviderMessageText>;
  let logger: MockedObject<Logger>;
  let phoneSaver: MockedObject<PhoneSaver>;
  let phoneProvider: MockedObject<PhoneProvider>;
  let phoneRemover: MockedObject<PhoneRemover>;

  let oneRedirectLink: OtpCode;

  beforeEach(() => {
    sender = { send: vi.fn() };
    codeGenerator = { generate: vi.fn() };
    providerMessageTexter = { messageText: vi.fn() };
    logger = { error: vi.fn(), with: vi.fn().mockReturnThis() };
    phoneSaver = { save: vi.fn() };
    phoneProvider = { byPhone: vi.fn(), byPhoneAndCode: vi.fn() };
    phoneRemover = { byId: vi.fn() };

    oneRedirectLink = new OtpCode(
      sender,
      codeGenerator,
      providerMessageTexter,
      logger,
      phoneSaver,
      phoneProvider,
      phoneRemover
    );
  });

  describe("fromUs", () => {
    test("should throw an error if the phone is invalid", async () => {
      const invalidPhone = "89997564234";
      phoneProvider.byPhone.mockResolvedValue(null);

      await expect(oneRedirectLink.fromUs(invalidPhone)).rejects.toThrow(
        ErrorMessages.InvalidPhone
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.InvalidPhone}`
      );
    });

    test("should successfully send a message and save a new phone record", async () => {
      const validPhone = "+79999876543";
      const generatedCode = "123456";
      const messageText = "Your code is 123456";

      phoneProvider.byPhone.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue(generatedCode);
      providerMessageTexter.messageText.mockReturnValue(messageText);
      sender.send.mockResolvedValue(true);
      phoneSaver.save.mockResolvedValue(new Phone(validPhone));

      const result = await oneRedirectLink.fromUs(validPhone);

      expect(result).toBe(true);
      expect(codeGenerator.generate).toHaveBeenCalled();
      expect(sender.send).toHaveBeenCalledWith(validPhone, messageText);
      expect(phoneSaver.save).toHaveBeenCalled();
    });

    test("should delete existing code and update the record", async () => {
      const validPhone = "+79999876543";
      const existingPhone = new Phone(validPhone);
      existingPhone.setCode("oldCode");

      phoneProvider.byPhone.mockResolvedValue(existingPhone);
      codeGenerator.generate.mockResolvedValue("newCode");
      providerMessageTexter.messageText.mockReturnValue("Your code is newCode");
      sender.send.mockResolvedValue(true);
      phoneSaver.save.mockResolvedValue(existingPhone);

      const result = await oneRedirectLink.fromUs(validPhone);

      expect(result).toBe(true);
      expect(existingPhone.getCode()).toBe("newCode");
      expect(phoneSaver.save).toHaveBeenCalledWith(existingPhone);
    });

    test("should throw an error if the message was not sent", async () => {
      const validPhone = "+79999876543";

      phoneProvider.byPhone.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue("123456");
      providerMessageTexter.messageText.mockReturnValue("Your code is 123456");
      sender.send.mockResolvedValue(false);

      await expect(oneRedirectLink.fromUs(validPhone)).rejects.toThrow(
        ErrorMessages.MessageWasNotSend
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.MessageWasNotSend}`
      );
    });
  });

  describe("toUs", () => {
    test("should return false if no phone with code is found", async () => {
      const phone = "+79999876543";
      const code = "123456";

      phoneProvider.byPhoneAndCode.mockResolvedValue(null);

      const result = await oneRedirectLink.toUs(phone, code);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.RecordNotExists}`
      );
    });

    test("should successfully remove phone by id if phone and code are valid", async () => {
      const phone = "+79999876543";
      const code = "123456";
      const existingPhone = new Phone(phone);
      existingPhone.setCode(code);
      existingPhone.setId("phone-id");

      phoneProvider.byPhoneAndCode.mockResolvedValue(existingPhone);
      phoneRemover.byId.mockResolvedValue(true);

      const result = await oneRedirectLink.toUs(phone, code);

      expect(result).toBe(true);
      expect(phoneRemover.byId).toHaveBeenCalledWith("phone-id");
    });
  });
});
