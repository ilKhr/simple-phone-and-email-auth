import bcrypt from "bcrypt";
import pino from "pino";
import { Server } from "./app/http/server";
import { EmailPassword } from "./services/sso/internal/signIn/strategies/email/emailPassword";
import { SsoService } from "./services/sso/internal/sso";
import { PinoAdapter } from "./adapters/pino";
import { SqliteUserRepository } from "./storage/sqlite3/user";
import { SQLiteConnection } from "./storage/sqlite3/database";
import { PasswordService } from "./services/password/password";
import { RedisConnection } from "./storage/redis/database";
import { SessionService } from "./services/session/internal/session";
import { RedisSessionRepository } from "./storage/redis/session";
import { EmailPasswordSignUpStrategies } from "./services/sso/internal/signUp/strategies/email/emailPassword";
import { EmailService } from "./services/email/email";

import * as configs from "./config/";
import { Nodemailer } from "./services/email/integrations/nodemailer";
import { otpGenerator, randomStringGenerator } from "./utils/gererators";
import { MessageProvider } from "./services/messageProvider/messageProvider";
import { LocalMessageProvideStrategies } from "./services/messageProvider/strategies/local";
import { HttpRouter } from "./app/http/routes/router";
import { SqliteOtpRepository } from "./storage/sqlite3/otp";

console.log("KEK");

(async () => {
  const mode = "local";

  const config = configs[mode];

  // TODO: setup logger for different MODE
  const logger = new PinoAdapter(
    pino({
      level: "info",
      transport: {
        target: "pino-pretty",
      },
    })
  );

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

  const userRepository = new SqliteUserRepository(dbSqlite, logger);
  const sessionRepository = new RedisSessionRepository(
    dbRedis,
    { generateId: randomStringGenerator },
    logger
  );

  const otpRepository = new SqliteOtpRepository(dbSqlite, logger);

  const localMessageStrategy = new LocalMessageProvideStrategies();
  const messageProvider = new MessageProvider(localMessageStrategy);

  const passwordService = PasswordService.getInstance(bcrypt);

  const emailSender = new Nodemailer(config.config.services.email);
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

  const router = HttpRouter(ssoService);

  const server = new Server(config.config.services.sso.http);

  Object.entries(router).forEach(([ednpoint, methods]) => {
    Object.entries(methods).forEach(([m, sh]) => {
      server.route(m, sh.schema, ednpoint, sh.handler);
    });
  });

  server.run(3000, (err, port) => {
    if (err) {
      logger.error(`Server not started: ${err}`);
    }
    logger.info(`Server run on: ${port}`);
  });
})();
