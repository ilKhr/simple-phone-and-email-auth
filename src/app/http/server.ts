import Fastify, {
  FastifyInstance,
  FastifySchema,
  HTTPMethods,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault,
  RouteHandlerMethod,
} from "fastify";

import fastifyCookie from "@fastify/cookie";
import fastifySwagger from "@fastify/swagger";

export type Handler<S extends FastifySchema> = RouteHandlerMethod<
  RawServerBase,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  {
    Body: S["body"];
    Headers: S["headers"];
    Params: S["params"];
    Querystring: S["querystring"];
    Reply: S["response"];
  }
>;

type Config = {
  cookieSecret: string;
};

export class Server {
  private server: FastifyInstance;

  constructor(private config: Config) {
    console.log("HERE");
    this.server = Fastify({
      logger: true,
    });

    this.server.register(fastifyCookie, {
      secret: this.config.cookieSecret,
    });

    this.server.register(fastifySwagger);
  }

  public route = <S extends FastifySchema>(
    method: HTTPMethods,
    schema: S,
    url: string,
    handler: Handler<S>
  ) => {
    this.server.route({ method, url, schema, handler });
  };

  run = (port: number, cb: (err: Error | null, address: string) => void) => {
    this.server.listen({ port }, cb);
  };

  stop = (cb: () => void) => {
    this.server.close(cb);
  };
}
