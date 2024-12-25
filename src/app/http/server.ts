import Fastify, {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault,
  RouteHandlerMethod,
} from "fastify";

import fastifyCookie from "@fastify/cookie";
import fastifyMiddie from "@fastify/middie";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifySchema } from "fastify/types/schema";
import { FromSchema, JSONSchema } from "json-schema-to-ts";
import { HttpRouter } from "src/app/http/routes/router";
import { SsoService } from "src/services/sso/internal/sso";
import { OidcProviderCreate } from "src/app/http/oidc/oidc";

export type ServerSchema = Omit<FastifySchema, "response"> & {
  response: {
    200?: JSONSchema;
    302?: JSONSchema;
    400?: JSONSchema;
  };
};

type Reply<S> = S extends { 200?: infer R } ? R : never;

export type Handler<S extends ServerSchema> = RouteHandlerMethod<
  RawServerBase,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  {
    Body: S["body"] extends object ? FromSchema<S["body"]> : unknown;
    Headers: S["headers"] extends object ? FromSchema<S["headers"]> : unknown;
    Params: S["params"] extends object ? FromSchema<S["params"]> : unknown;
    Querystring: S["querystring"] extends object
      ? FromSchema<S["querystring"]>
      : unknown;
    Reply: S["response"] extends object
      ? FromSchema<Reply<S["response"]>>
      : unknown;
  }
>;

type Config = {
  cookieSecret: string;
};

interface GeneralParams {
  logger: FastifyBaseLogger;
  config: Config;
  ssoService: SsoService;
  oidcPort: number;
}

const registerPlugin = async (
  server: ReturnType<typeof Fastify>,
  config: Config
) => {
  await server.register(fastifyCookie, {
    secret: config.cookieSecret,
  });

  await server.register(fastifySwagger, {
    mode: "dynamic",
    openapi: {
      info: {
        title: "My API",
        description: "API documentation",
        version: "1.0.0",
      },
      openapi: "3.1.0",
    },
  });

  await server.register(fastifySwaggerUI, {
    routePrefix: "/swagger",
  });

  await server.register(fastifyMiddie);
};

const registerRouter = (
  server: ReturnType<typeof Fastify>,
  ssoService: SsoService
) => {
  const router = HttpRouter(ssoService);
  Object.entries(router).forEach(([endpoint, methods]) => {
    Object.entries(methods).forEach(([method, handler]) => {
      server.route({
        handler: handler.handler,
        method,
        schema: handler.schema,
        url: endpoint,
      });
    });
  });
};

const registerOidc = async (server: FastifyInstance, port: number) => {
  const oidc = await OidcProviderCreate(`http://localhost:${port}`);
  server.use("/oidc", oidc.callback());
};

const run = (
  server: FastifyInstance,
  port: number,
  cb: (err: Error | null, address: string) => void
) => {
  server.listen({ port }, cb);
};

const stop = (server: FastifyInstance, cb: () => void) => {
  server.close(cb);
};

export const ServerCreate = async (gp: GeneralParams) => {
  const server = Fastify({
    logger: false,
    loggerInstance: gp.logger,
    ajv: { customOptions: { coerceTypes: "array" } },
  });

  await registerPlugin(server, gp.config);
  registerRouter(server, gp.ssoService);
  await registerOidc(server, gp.oidcPort);

  return {
    run: (port: number, cb: (err: Error | null, address: string) => void) =>
      run(server, port, cb),
    stop: (cb: () => void) => stop(server, cb),
  };
};
