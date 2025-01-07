import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import {
  User,
  UserCreate,
  UserWithId,
} from "src/services/sso/internal/entities/user";
import { checkHasId } from "src/storage/utils/checkHasId";

const logSeparator = ";";

const ErrorMessages = {
  LastIdNotExists: "Last id not exists",
  ChangesNotExists: "Changes not exists",
  EntityIdNotExists: "Entity id not exists",
};

type UserRow = {
  id: number;
  password_hash: string;
  first_name: string;
  last_name: string | null;
  email_value: string | null;
  email_is_verified: number;
  phone_value: string | null;
  phone_is_verified: number;
};

interface Logger {
  error: (msg: string) => void;
  info: (msg: string) => void;
  with: (msg: string) => Logger;
}

type GeneralParams = {
  db: Database<sqlite3.Database, sqlite3.Statement>;
  logger: Logger;
};

const initializeUserTable = async (gp: GeneralParams): Promise<void> => {
  const op = `.initialize${logSeparator}`;
  const scopedLogger = gp.logger.with(op);

  try {
    // await gp.db.exec(`
    //   CREATE TABLE IF NOT EXISTS users (
    //     id INTEGER PRIMARY KEY,
    //     password_hash TEXT NOT NULL,
    //     email_value TEXT NULL,
    //     first_name TEXT NULL,
    //     last_name TEXT NULL,
    //     email_is_verified INTEGER NOT NULL,
    //     phone_value TEXT NULL,
    //     phone_is_verified INTEGER NOT NULL
    //   );
    // `);
    scopedLogger.info("Table 'users' initialized successfully");
  } catch (error) {
    scopedLogger.error(`err: Failed to initialize table 'users': ${error}`);
    throw error;
  }
};

const save = async (gp: GeneralParams, user: User): Promise<UserWithId> => {
  const op = `.save${logSeparator}`;
  const scopedLogger = gp.logger.with(op);

  console.log("USER_Before", user);

  if (user.getId()) {
    await gp.db.run(
      `UPDATE users SET password_hash = ?, email_value = ?, email_is_verified = ?, phone_value = ?, phone_is_verified = ?, first_name = ?, last_name = ? WHERE id = ?`,
      user.getPasswordHash(),
      user.getContacts().email.value,
      user.getContacts().email.isVerified,
      user.getContacts().phone.value,
      user.getContacts().phone.isVerified,
      user.getFirstName(),
      user.getLastName(),

      // where
      user.getId()
    );
  } else {
    const result = await gp.db.run(
      `INSERT INTO users (password_hash, email_value, email_is_verified, phone_value, phone_is_verified, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      user.getPasswordHash(),
      user.getContacts().email.value,
      user.getContacts().email.isVerified,
      user.getContacts().phone.value,
      user.getContacts().phone.isVerified,
      user.getFirstName(),
      user.getLastName()
    );

    if (!result.lastID) {
      scopedLogger.error(`err: ${ErrorMessages.LastIdNotExists}`);
      throw new Error(ErrorMessages.LastIdNotExists);
    }

    user.setId(result.lastID);
  }

  console.log("USER", user);

  return user as UserWithId;
};

const byId = async (
  gp: GeneralParams,
  id: number
): Promise<UserWithId | null> => {
  const row = await gp.db.get<UserRow>(`SELECT * FROM users WHERE id = ?`, id);
  return row ? mapToUser(row) : null;
};

const byEmail = async (
  gp: GeneralParams,
  email: string
): Promise<UserWithId | null> => {
  const row = await gp.db.get<UserRow>(
    `SELECT * FROM users WHERE email_value = ?`,
    email
  );
  return row ? mapToUser(row) : null;
};

const byPhone = async (
  gp: GeneralParams,
  phone: string
): Promise<UserWithId | null> => {
  const row = await gp.db.get<UserRow>(
    `SELECT * FROM users WHERE phone_value = ?`,
    phone
  );
  return row ? mapToUser(row) : null;
};

const deleteUserById = async (
  gp: GeneralParams,
  id: number
): Promise<boolean> => {
  const op = `.deleteById${logSeparator}`;
  const scopedLogger = gp.logger.with(op);

  const result = await gp.db.run(`DELETE FROM users WHERE id = ?`, id);

  if (!result.changes && result.changes != 0) {
    scopedLogger.error(`err: ${ErrorMessages.ChangesNotExists}`);
    throw new Error(ErrorMessages.ChangesNotExists);
  }

  return result.changes > 0;
};

const mapToUser = (row: UserRow): UserWithId => {
  const user = UserCreate({
    email: row.email_value,
    id: row.id,
    passwordHash: row.password_hash,
    phone: row.phone_value,
    firstName: row.first_name,
    lastName: row.last_name,
  });

  if (!checkHasId(user)) {
    throw new Error(ErrorMessages.EntityIdNotExists);
  }

  return user;
};

export const SqliteUserRepository = async (gp: GeneralParams) => {
  await initializeUserTable(gp);
  return {
    save: (user: User) => save(gp, user),
    byId: (id: number) => byId(gp, id),
    byEmail: (email: string) => byEmail(gp, email),
    byPhone: (phone: string) => byPhone(gp, phone),
    deleteUserById: (id: number) => deleteUserById(gp, id),
  };
};
