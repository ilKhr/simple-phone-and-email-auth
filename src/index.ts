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
import { randomStringGenerator, otpGenerator } from "src/utils/generators";
import { SmsRu } from "src/services/phone/integrations/smsru/smsru";
import { PhoneService } from "src/services/phone/phone";
import { PhonePasswordSignUpStrategies } from "src/services/sso/internal/signUp/strategies/phone/phonePassword";
import { PhoneCountyProvidersResolver } from "src/services/phone/resolver";
import { JwtAdapter } from "src/adapters/jwt";
import { LocalSms } from "src/services/phone/integrations/smsru/local";

(async () => {
  const mode = "local";

  const config = configs[mode].config;

  const pinoLogger = pino({
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  });

  // TODO: setup logger for different MODE
  const logger = new PinoAdapter(pinoLogger);

  const connectionSqlite = await SQLiteConnection.getInstance(
    config.services.sso.database.sqlite.url
  );
  const dbSqlite = await connectionSqlite.getDb();

  const connectionRedis = await RedisConnection.getInstance(
    config.services.session.database.redis.url,
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

  const jwt = JwtAdapter(config.services.sso.jwt);
  const passwordService = PasswordService({ hasher: bcrypt });

  const emailSender = Nodemailer({ nmParams: config.services.email });
  const phoneResolver = PhoneCountyProvidersResolver({
    providers: {
      RU: [
        SmsRu({
          smsRuParams: config.services.phone.smsRu,
          logger,
        }),
        LocalSms({
          logger,
          isActive: config.services.phone.local.isActive,
        }),
      ],
    },
  });

  const emailSendService = EmailService({ emailSender, logger });
  const phoneSendService = new PhoneService(phoneResolver, logger);

  const sessionService = SessionService({
    logger,
    sessionRemover: {
      byId: sessionRepository.deleteById,
    },
    sessionSaver: sessionRepository,
  });

  const ssoService = new SsoService(
    {
      EmailPasswordSignInStrategy: new EmailPassword(
        userRepository,
        passwordService,
        { save: sessionService.create },
        jwt,
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
          messageText: messageProvider.getTemplate("verify", "email"),
        },
        {
          byId: otpRepository.deleteById,
        },
        otpRepository,
        passwordService,
        userRepository,
        { save: sessionService.create },
        jwt,
        config.services.email.from.noreply
      ),
      PhonePasswordSignUpStrategy: new PhonePasswordSignUpStrategies(
        otpRepository,
        logger,
        userRepository,
        phoneSendService,
        {
          generate: otpGenerator,
        },
        {
          messageText: messageProvider.getTemplate("verify", "phone"),
        },
        {
          byId: otpRepository.deleteById,
        },
        otpRepository,
        passwordService,
        userRepository,
        { save: sessionService.create },
        jwt,
        config.services.email.from.noreply
      ),
    },
    logger
  );

  const server = await Server({
    logger: pinoLogger,
    config: config.services.sso.http,
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
