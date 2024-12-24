import bcrypt from "bcrypt";
import pino from "pino";
import { version } from "package.json";

import * as configs from "src/config/";

import { Server } from "src/app/http/server";
import { PinoAdapter } from "src/adapters/pino";
import { EmailService } from "src/services/email/email";
import { Nodemailer } from "src/services/email/integrations/nodemailer";
import { MessageProvider } from "src/services/messageProvider/messageProvider";
import { LocalMessageProvideStrategies } from "src/services/messageProvider/strategies/local";
import { PasswordService } from "src/services/password/password";
import { SessionService } from "src/services/session/internal/session";
import { EmailPassword } from "src/services/sso/internal/signIn/strategies/email/emailPassword";
import { EmailPasswordSignUpStrategies } from "src/services/sso/internal/signUp/strategies/email/emailPassword";
import { SsoService } from "src/services/sso/internal/sso";
import { RedisConnection } from "src/storage/redis/database";
import { RedisSessionRepository } from "src/storage/redis/session";
import { SQLiteConnection } from "src/storage/sqlite3/database";
import { SqliteOtpRepository } from "src/storage/sqlite3/otp";
import { SqliteUserRepository } from "src/storage/sqlite3/user";
import { randomStringGenerator, otpGenerator } from "src/utils/gererators";

(async () => {
  const mode = "local";

  const config = configs[mode];

  const pinoLogger = pino({
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  });

  // TODO: setup logger for different MODE
  const logger = new PinoAdapter(pinoLogger);

  // TODO: add config
  const connectionSqlite = await SQLiteConnection.getInstance(
    // TODO: add path from config
    config.config.services.sso.database.sqlite.url
  );
  const dbSqlite = await connectionSqlite.getDb();

  const connectionRedis = await RedisConnection.getInstance(
    // TODO: add path from config
    config.config.services.session.database.redis.url,
    logger
  );

  const dbRedis = connectionRedis.getClient();

  const userRepository = await SqliteUserRepository({ db: dbSqlite, logger });
  const sessionRepository = RedisSessionRepository({
    generatorId: { generateId: randomStringGenerator },
    logger,
    redisClient: dbRedis,
  });

  const otpRepository = await SqliteOtpRepository({ db: dbSqlite, logger });

  const localMessageStrategy = LocalMessageProvideStrategies();
  const messageProvider = MessageProvider({
    templateProvider: localMessageStrategy,
  });

  const passwordService = PasswordService({ hasher: bcrypt });

  const emailSender = Nodemailer({ nmParams: config.config.services.email });
  const emailSendService = new EmailService(emailSender, logger);

  const sessionService = new SessionService(
    sessionRepository,
    {
      byId: sessionRepository.deleteById,
    },
    logger
  );

  const ssoService = new SsoService(
    {
      EmailPasswordStategy: new EmailPassword(
        userRepository,
        passwordService,
        sessionService,
        logger
      ),
    },
    {
      EmailPasswordSignUpStrategy: new EmailPasswordSignUpStrategies(
        otpRepository,
        logger,
        userRepository,
        emailSendService,
        {
          generate: otpGenerator,
        },
        {
          messageText: messageProvider.getMessage("verify", "email"),
        },
        {
          byId: otpRepository.deleteById,
        },
        otpRepository,
        passwordService,
        userRepository,
        sessionService
      ),
    },
    logger
  );

  const server = await Server({
    logger: pinoLogger,
    config: config.config.services.sso.http,
    ssoService,
  });

  server.run(3000, (err, port) => {
    if (err) {
      logger.error(`Server not started: ${err}`);
    }
    logger.info(`Server run on: ${port}`);
    logger.info(`Version: ${version}`);
  });
})();
