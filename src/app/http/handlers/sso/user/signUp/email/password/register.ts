import { SsoService } from "../../../../../../../../services/sso/internal/sso";
import { Handler, ServerSchema } from "../../../../../../server";

export const schema = {
  body: {
    type: "object",
    required: ["email", "password", "code"],
    properties: {
      email: {
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
      "EmailPasswordSignUpStrategy",
      request.body
    );

    return {
      sessionId,
    };
  },
  schema,
});
