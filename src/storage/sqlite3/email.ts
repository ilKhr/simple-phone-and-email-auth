import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import { Email } from "../../services/email/internal/entities/email";

const logSeparator = ";";

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  LastIdNotExists: "Last id not exists",
  ChangesNotExists: "ChangesNotExists",
};

export class SqliteEmailRepository {
  private op = "email.storage.sqliteEmailRepository";
  private logger: Logger;

  private db: Database<sqlite3.Database, sqlite3.Statement>;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>, l: Logger) {
    this.db = db;
    this.logger = l.with(`op: ${this.op}`);
  }

  async save(email: Email): Promise<Email> {
    const op = `.save${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    if (email.getId()) {
      await this.db.run(
        `UPDATE emails SET code = ? WHERE id = ?`,
        email.getCode(),
        email.getId()
      );
    } else {
      const result = await this.db.run(
        `INSERT INTO emails (email, code) VALUES (?, ?)`,
        email.get(),
        email.getCode()
      );

      if (!result.lastID) {
        logger.error(`err: ${ErrorMessages.LastIdNotExists}`);

        throw new Error(ErrorMessages.LastIdNotExists);
      }

      email.setId(result.lastID.toString());
    }
    return email;
  }

  async byEmail(e: string): Promise<Email | null> {
    const row = await this.db.get(`SELECT * FROM emails WHERE email = ?`, e);
    return row ? this.mapToEmail(row) : null;
  }

  async byEmailAndCode(e: string, c: string): Promise<Email | null> {
    const row = await this.db.get(
      `SELECT * FROM emails WHERE email = ? AND code = ?`,
      e,
      c
    );
    return row ? this.mapToEmail(row) : null;
  }

  async byId(id: string): Promise<boolean> {
    const op = `.save${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const result = await this.db.run(`DELETE FROM emails WHERE id = ?`, id);

    if (!result.changes && result.changes != 0) {
      logger.error(`err: ${ErrorMessages.ChangesNotExists}`);

      throw new Error(ErrorMessages.ChangesNotExists);
    }

    return result.changes > 0;
  }

  // Convert db row to Email object
  private mapToEmail(row: any): Email {
    const email = new Email(row.email);
    email.setId(row.id);
    email.setCode(row.code);
    return email;
  }
}
