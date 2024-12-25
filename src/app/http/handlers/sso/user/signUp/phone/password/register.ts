import { ServerSchema, Handler } from "src/app/http/server";
import { SsoService } from "src/services/sso/internal/sso";

export const schema = {
  body: {
    type: "object",
    required: ["phone", "password", "code"],
    properties: {
      phone: {
        type: "string",
      },
      password: {
        type: "string",
      },
      code: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      required: ["sessionId"],
      properties: {
        sessionId: {
          type: "string",
        },
      },
      additionalProperties: false,
    },
  },
} as const satisfies ServerSchema;

export const handlerFactory = (
  ssoService: SsoService
): {
  handler: Handler<typeof schema>;
  schema: typeof schema;
} => ({
  handler: async (request) => {
    const sessionId = await ssoService.register(
      "PhonePasswordSignUpStrategy",
      request.body
    );

    return {
      sessionId,
    };
  },
  schema,
});
