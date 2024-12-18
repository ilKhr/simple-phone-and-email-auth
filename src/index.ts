import bcrypt from "bcrypt";

import pino from "pino";
import { Server } from "./app/http/server";
import { EmailPassword } from "./services/sso/internal/signIn/strategies/email/emailPassword";
import { SsoService } from "./services/sso/internal/sso";
import { PinoAdapter } from "./adapters/pino";
import { SqliteUserRepository } from "./storage/sqlite3/user";
import { SQLiteConnection } from "./storage/sqlite3/database";
import { PasswordService } from "./services/email/password/password";
import { RedisConnection } from "./storage/redis/database";
import { SessionService } from "./services/session/internal/session";
import { RedisSessionRepository } from "./storage/redis/session";
import { EmailPasswordSignUpStrategies } from "./services/sso/internal/signUp/strategies/email/emailPassword";
import { RedisOtpRepository } from "./storage/redis/otp";

(async () => {
  const server = new Server();

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
    "path-from-config"
  );
  const dbSqlite = await connectionSqlite.getDb();

  const connectionRedis = await RedisConnection.getInstance(
    // TODO: add path from config
    "path-from-config",
    logger
  );

  const dbRedis = connectionRedis.getClient();

  const passwordService = PasswordService.getInstance(bcrypt);

  const userRepository = new SqliteUserRepository(dbSqlite, logger);
  const sessionRepository = new RedisSessionRepository(dbRedis, logger);

  const otpRepository = new RedisOtpRepository(logger);

  const sessionService = new SessionService(
    sessionRepository,
    {
      byId: sessionRepository.deleteById,
    },
    logger
  );

  // TODO: fill service
  const ssoService = new SsoService(
    {
      EmailPassword: new EmailPassword(
        userRepository,
        passwordService,
        sessionService,
        logger
      ),
    },
    {
      signUpEmailPassword: new EmailPasswordSignUpStrategies(
        otpRepository,
        logger,
        userRepository,
        {
          send: () => "",
        },
        () => "",
        () => "",
        {
          byId: otpRepository.deleteById,
        },
        otpRepository,
        {
          hash: () => "",
        },
        userRepository,
        sessionService
      ),
    },
    logger
  );

  server.run(3000, (err, port) => {
    if (err) {
      logger.error(`Server not started: ${err}`);
    }
    logger.info(`Server run on: ${port}`);
  });
})();
