import pino from "pino";

export interface Logger {
  error: (msg: string) => void;
  info: (msg: string) => void;
  with: (msg: string) => Logger;
}

export class PinoAdapter implements Logger {
  private logger: pino.Logger & { context?: string };

  constructor(logger: pino.Logger) {
    this.logger = logger;

    if (this.logger.context === undefined) {
      this.logger.context = "";
    }
  }

  error(msg: string): void {
    this.logger.error(msg);
  }

  info(msg: string): void {
    this.logger.info(msg);
  }

  with(msg: string): Logger {
    const childLogger = this.logger.child({
      context: `${this.logger.context}${msg}`,
    });

    //@ts-ignore
    childLogger.context = `${this.logger.context}${msg}`;

    return new PinoAdapter(childLogger);
  }
}
