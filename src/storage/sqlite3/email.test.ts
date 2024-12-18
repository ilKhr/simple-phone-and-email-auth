import { vi, describe, beforeEach, expect, test, Mock } from "vitest";
import { Email } from "../../services/email/internal/entities/email";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";
import { SqliteEmailRepository } from "./email";

describe("SqliteEmailRepository", () => {
  let db: Database<sqlite3.Database, sqlite3.Statement> & {
    run: Mock;
    get: Mock;
  };
  let logger: any;
  let emailRepository: SqliteEmailRepository;

  beforeEach(() => {
    db = {
      run: vi.fn(),
      get: vi.fn(),
    } as unknown as typeof db;

    logger = { error: vi.fn(), with: vi.fn().mockReturnThis() };

    emailRepository = new SqliteEmailRepository(db, logger);
  });

  describe("save", () => {
    test("should update email if id exists", async () => {
      const email = new Email("test@example.com");
      email.setId("123");
      email.setCode("456");

      db.run.mockResolvedValue({ lastID: null });

      await emailRepository.save(email);

      expect(db.run).toHaveBeenCalledWith(
        `UPDATE emails SET code = ? WHERE id = ?`,
        "456",
        "123"
      );
    });

    test("should insert new email if id does not exist", async () => {
      const email = new Email("new@example.com");
      email.setCode("789");

      db.run.mockResolvedValue({ lastID: 1 });

      await emailRepository.save(email);

      expect(db.run).toHaveBeenCalledWith(
        `INSERT INTO emails (email, code) VALUES (?, ?)`,
        "new@example.com",
        "789"
      );
      expect(email.getId()).toBe("1");
    });

    test("should throw an error if lastID does not exist", async () => {
      const email = new Email("new@example.com");
      email.setCode("789");

      db.run.mockResolvedValue({ lastID: null });

      await expect(emailRepository.save(email)).rejects.toThrow(
        "Last id not exists"
      );
      expect(logger.error).toHaveBeenCalledWith("err: Last id not exists");
    });
  });

  describe("byEmail", () => {
    test("should return email if found", async () => {
      const emailRow = { id: "1", email: "test@example.com", code: "123" };
      db.get.mockResolvedValue(emailRow);

      const result = await emailRepository.byEmail("test@example.com");

      expect(result).toBeInstanceOf(Email);
      expect(result?.get()).toBe("test@example.com");
    });

    test("should return null if email not found", async () => {
      db.get.mockResolvedValue(null);

      const result = await emailRepository.byEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("byEmailAndCode", () => {
    test("should return email if found", async () => {
      const emailRow = { id: "1", email: "test@example.com", code: "123" };
      db.get.mockResolvedValue(emailRow);

      const result = await emailRepository.byEmailAndCode(
        "test@example.com",
        "123"
      );

      expect(result).toBeInstanceOf(Email);
      expect(result?.getCode()).toBe("123");
    });

    test("should return null if email and code not found", async () => {
      db.get.mockResolvedValue(null);

      const result = await emailRepository.byEmailAndCode(
        "test@example.com",
        "wrongcode"
      );

      expect(result).toBeNull();
    });
  });

  describe("byId", () => {
    test("should delete email by id", async () => {
      db.run.mockResolvedValue({ changes: 1 });

      const result = await emailRepository.byId("1");

      expect(result).toBe(true);
      expect(db.run).toHaveBeenCalledWith(
        `DELETE FROM emails WHERE id = ?`,
        "1"
      );
    });

    test("should return false if no changes occurred", async () => {
      db.run.mockResolvedValue({ changes: 0 });

      const result = await emailRepository.byId("1");

      expect(result).toBe(false);
    });

    test("should throw an error if changes are undefined", async () => {
      db.run.mockResolvedValue({ changes: undefined });

      await expect(emailRepository.byId("1")).rejects.toThrow(
        "ChangesNotExists"
      );
      expect(logger.error).toHaveBeenCalledWith("err: ChangesNotExists");
    });
  });
});
