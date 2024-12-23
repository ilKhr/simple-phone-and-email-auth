import Fastify, {
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault,
  RouteHandlerMethod,
} from "fastify";

import fastifyCookie from "@fastify/cookie";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifySchema } from "fastify/types/schema";
import { FromSchema, JSONSchema } from "json-schema-to-ts";
import { SsoService } from "../../services/sso/internal/sso";
import { HttpRouter } from "./routes/router";

export type ServerSchema = Omit<FastifySchema, "response"> & {
  response: {
    200: JSONSchema;
    400?: JSONSchema;
  };
};

type Reply<S> = S extends { 200: infer R } ? R : never;

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

export const Server = async (config: Config, ssoService: SsoService) => {
  const server = Fastify({
    logger: true,
    ajv: { customOptions: { coerceTypes: "array" } },
  });

  const registerPlugin = async () => {
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
  };

  const registerRouter = () => {
    const router = HttpRouter(ssoService);
    Object.entries(router).forEach(([ednpoint, methods]) => {
      Object.entries(methods).forEach(([m, sh]) => {
        server.route({
          handler: sh.handler,
          method: m,
          schema: sh.schema,
          url: ednpoint,
        });
      });
    });
  };

  await registerPlugin();

  registerRouter();

  const run = (
    port: number,
    cb: (err: Error | null, address: string) => void
  ) => {
    server.listen({ port }, cb);
  };

  const stop = (cb: () => void) => {
    server.close(cb);
  };

  return {
    run,
    stop,
  };
};
