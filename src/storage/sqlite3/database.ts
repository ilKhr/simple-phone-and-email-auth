import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const ErrorMessages = {
  DBConnectNotInit: "Database connection is not initialized",
};

export class SQLiteConnection {
  private static instance: SQLiteConnection | null = null;
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
  private dbPath: string;

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  public static async getInstance(dbPath: string): Promise<SQLiteConnection> {
    if (!SQLiteConnection.instance) {
      SQLiteConnection.instance = new SQLiteConnection(dbPath);
      await SQLiteConnection.instance.initialize();
    }
    return SQLiteConnection.instance;
  }

  private async initialize(): Promise<void> {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    });

    await this.createTables();
  }

  public async getDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (!this.db) {
      throw new Error(ErrorMessages.DBConnectNotInit);
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error(ErrorMessages.DBConnectNotInit);
    }

    // TODO: create migrations
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        password_hash TEXT NOT NULL,
        email_value TEXT,
        email_is_verified INTEGER DEFAULT 0,
        phone_value TEXT,
        phone_is_verified INTEGER DEFAULT 0
      )
    `);
  }
}
