import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import { User } from "../../services/sso/internal/entities/user";

const logSeparator = ";";

interface Logger {
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

const ErrorMessages = {
  LastIdNotExists: "Last id not exists",
  ChangesNotExists: "ChangesNotExists",
};

// Типизация строки из базы данных
interface UserRow {
  id: string | null;
  password_hash: string;
  email_value: string | null;
  email_is_verified: number;
  phone_value: string | null;
  phone_is_verified: number;
}

export class SqliteUserRepository {
  private op = "user.storage.sqliteUserRepository";
  private logger: Logger;

  private db: Database<sqlite3.Database, sqlite3.Statement>;

  constructor(db: Database<sqlite3.Database, sqlite3.Statement>, l: Logger) {
    this.db = db;
    this.logger = l.with(`op: ${this.op}`);
  }

  async save(user: User): Promise<User> {
    const op = `.save${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    if (user.getId()) {
      await this.db.run(
        `UPDATE users SET password_hash = ?, email_value = ?, email_is_verified = ?, phone_value = ?, phone_is_verified = ? WHERE id = ?`,
        user.getPasswordHash(),
        user.getContacts().email.value,
        user.getContacts().email.isVerified,
        user.getContacts().phone.value,
        user.getContacts().phone.isVerified,
        user.getId()
      );
    } else {
      const result = await this.db.run(
        `INSERT INTO users (password_hash, email_value, email_is_verified, phone_value, phone_is_verified) VALUES (?, ?, ?, ?, ?)`,
        user.getPasswordHash(),
        user.getContacts().email.value,
        user.getContacts().email.isVerified,
        user.getContacts().phone.value,
        user.getContacts().phone.isVerified
      );

      if (!result.lastID) {
        logger.error(`err: ${ErrorMessages.LastIdNotExists}`);
        throw new Error(ErrorMessages.LastIdNotExists);
      }

      user.setId(result.lastID.toString());
    }
    return user;
  }

  async byId(id: string): Promise<User | null> {
    const row = await this.db.get<UserRow>(
      `SELECT * FROM users WHERE id = ?`,
      id
    );
    return row ? this.mapToUser(row) : null;
  }

  async byEmail(email: string): Promise<User | null> {
    const row = await this.db.get<UserRow>(
      `SELECT * FROM users WHERE email_value = ?`,
      email
    );
    return row ? this.mapToUser(row) : null;
  }

  async byPhone(phone: string): Promise<User | null> {
    const row = await this.db.get<UserRow>(
      `SELECT * FROM users WHERE phone_value = ?`,
      phone
    );
    return row ? this.mapToUser(row) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const op = `.deleteById${logSeparator}`;
    const logger = this.logger.with(`${op}`);

    const result = await this.db.run(`DELETE FROM users WHERE id = ?`, id);

    if (!result.changes && result.changes != 0) {
      logger.error(`err: ${ErrorMessages.ChangesNotExists}`);
      throw new Error(ErrorMessages.ChangesNotExists);
    }

    return result.changes > 0;
  }

  // Convert db row to User object
  private mapToUser(row: UserRow): User {
    const user = new User({
      email: row.email_value,
      id: row.id,
      passwordHash: row.password_hash,
      phone: row.phone_value,
    });
    return user;
  }
}
