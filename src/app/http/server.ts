import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifySchema,
  HTTPMethods,
  RouteGenericInterface,
  RouteHandler,
} from "fastify";

export type Handler<
  Schema extends {
    request: FastifySchema;
    reply: RouteGenericInterface["Reply"];
  }
> = RouteHandler<{
  Body: Schema["request"]["body"];
  Headers: Schema["request"]["headers"];
  Params: Schema["request"]["params"];
  Querystring: Schema["request"]["querystring"];
  Reply: Schema["reply"];
}>;

export class Server {
  private server: FastifyInstance;

  constructor() {
    this.server = Fastify({
      logger: true,
    });
  }

  public register = (
    method: HTTPMethods,
    schema: FastifySchema,
    url: string,
    handler: (
      req: FastifyRequest,
      res: FastifyReply
    ) => Promise<unknown> | unknown
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
