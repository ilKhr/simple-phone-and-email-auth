import { Email } from "../entities/email";
import { vi, describe, beforeEach, expect, test } from "vitest";
import { OneRedirectLink, ErrorMessages } from "./oneRedirectLink";

describe("OneRedirectLink", () => {
  let sender: any;
  let codeGenerator: any;
  let providerMessageTexter: any;
  let logger: any;
  let emailSaver: any;
  let emailProvider: any;
  let emailRemover: any;

  let oneRedirectLink: OneRedirectLink;

  beforeEach(() => {
    sender = { send: vi.fn() };
    codeGenerator = { generate: vi.fn() };
    providerMessageTexter = { messageText: vi.fn() };
    logger = { error: vi.fn(), with: vi.fn().mockReturnThis() };
    emailSaver = { save: vi.fn() };
    emailProvider = { byEmail: vi.fn(), byEmailAndCode: vi.fn() };
    emailRemover = { byId: vi.fn() };

    oneRedirectLink = new OneRedirectLink(
      sender,
      codeGenerator,
      providerMessageTexter,
      logger,
      emailSaver,
      emailProvider,
      emailRemover
    );
  });

  describe("fromUs", () => {
    test("should throw an error if the email is invalid", async () => {
      const invalidEmail = "invalid-email";
      emailProvider.byEmail.mockResolvedValue(null);

      await expect(oneRedirectLink.fromUs(invalidEmail)).rejects.toThrow(
        ErrorMessages.InvalidEmail
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.InvalidEmail}`
      );
    });

    test("should successfully send a message and save a new email record", async () => {
      const validEmail = "test@example.com";
      const generatedCode = "123456";
      const messageText = "Your code is 123456";

      emailProvider.byEmail.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue(generatedCode);
      providerMessageTexter.messageText.mockReturnValue(messageText);
      sender.send.mockResolvedValue(true);
      emailSaver.save.mockResolvedValue(new Email(validEmail));

      const result = await oneRedirectLink.fromUs(validEmail);

      expect(result).toBe(true);
      expect(codeGenerator.generate).toHaveBeenCalled();
      expect(sender.send).toHaveBeenCalledWith(validEmail, messageText);
      expect(emailSaver.save).toHaveBeenCalled();
    });

    test("should delete existing code and update the record", async () => {
      const validEmail = "test@example.com";
      const existingEmail = new Email(validEmail);
      existingEmail.setCode("oldCode");

      emailProvider.byEmail.mockResolvedValue(existingEmail);
      codeGenerator.generate.mockResolvedValue("newCode");
      providerMessageTexter.messageText.mockReturnValue("Your code is newCode");
      sender.send.mockResolvedValue(true);
      emailSaver.save.mockResolvedValue(existingEmail);

      const result = await oneRedirectLink.fromUs(validEmail);

      expect(result).toBe(true);
      expect(existingEmail.getCode()).toBe("newCode");
      expect(emailSaver.save).toHaveBeenCalledWith(existingEmail);
    });

    test("should throw an error if the message was not sent", async () => {
      const validEmail = "test@example.com";

      emailProvider.byEmail.mockResolvedValue(null);
      codeGenerator.generate.mockResolvedValue("123456");
      providerMessageTexter.messageText.mockReturnValue("Your code is 123456");
      sender.send.mockResolvedValue(false);

      await expect(oneRedirectLink.fromUs(validEmail)).rejects.toThrow(
        ErrorMessages.MessageWasNotSend
      );

      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.MessageWasNotSend}`
      );
    });
  });

  describe("toUs", () => {
    test("should return false if no email with code is found", async () => {
      const email = "test@example.com";
      const code = "123456";

      emailProvider.byEmailAndCode.mockResolvedValue(null);

      const result = await oneRedirectLink.toUs(email, code);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        `err: ${ErrorMessages.RecordNotExists}`
      );
    });

    test("should successfully remove email by id if email and code are valid", async () => {
      const email = "test@example.com";
      const code = "123456";
      const existingEmail = new Email(email);
      existingEmail.setCode(code);
      existingEmail.setId("email-id");

      emailProvider.byEmailAndCode.mockResolvedValue(existingEmail);
      emailRemover.byId.mockResolvedValue(true);

      const result = await oneRedirectLink.toUs(email, code);

      expect(result).toBe(true);
      expect(emailRemover.byId).toHaveBeenCalledWith("email-id");
    });
  });
});
