import { createClient, RedisClientType } from "redis";

const ErrorMessages = {
  Redis: "Redis connection is not initialized",
  RedisConnectNotInit: "Redis connection is not initialized",
};

const InfoMessages = {
  SuccessConnection: "Success connection",
  Dissconnect: "Dissconnect",
};

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  with: (msg: string) => Logger;
}

export class RedisConnection {
  private op = "storage.database.redisConnection";
  private logger: Logger;

  private static instance: RedisConnection | null = null;
  private client: RedisClientType | null = null;
  private url: string;

  private constructor(url: string, l: Logger) {
    this.url = url;
    this.logger = l.with(`op: ${this.op}`);
  }

  public static async getInstance(
    url: string,
    l: Logger
  ): Promise<RedisConnection> {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection(url, l);
      await RedisConnection.instance.initialize();
    }
    return RedisConnection.instance;
  }

  private async initialize(): Promise<void> {
    const op = `initialize`;
    const logger = this.logger.with(`${op}`);

    this.client = createClient({ url: this.url });

    this.client.on("error", (err) => {
      logger.error(`err: ${err}`);
    });

    await this.client.connect();

    logger.info(InfoMessages.SuccessConnection);
  }

  public getClient(): RedisClientType {
    if (!this.client) {
      throw new Error(ErrorMessages.RedisConnectNotInit);
    }
    return this.client;
  }

  public async close(): Promise<void> {
    const op = `close`;
    const logger = this.logger.with(`${op}`);

    if (this.client) {
      await this.client.quit();
      this.client = null;

      logger.info("Disconnected from Redis");
    }
  }
}
