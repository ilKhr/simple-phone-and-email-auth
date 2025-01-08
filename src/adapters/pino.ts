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
    const newContext = this.logger.context
      ? `${this.logger.context}.${msg}`
      : `👆${msg}`;

    const childLogger = this.logger.child({
      context: newContext,
    });

    //@ts-ignore
    childLogger.context = newContext;

    return new PinoAdapter(childLogger);
  }
}
