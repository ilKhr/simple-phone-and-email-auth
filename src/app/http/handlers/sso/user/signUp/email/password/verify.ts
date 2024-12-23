import { SsoService } from "../../../../../../../../services/sso/internal/sso";
import { Handler, ServerSchema } from "../../../../../../server";

const schema = {
  description: "Verify user email",
  body: {
    type: "object",
    required: ["email"],
    properties: {
      email: {
        type: "string",
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      required: ["status"],
      properties: {
        status: {
          type: "string",
          enum: ["ok"],
        },
      },
      additionalProperties: false,
    },
    400: {
      type: "object",
      required: ["error"],
      properties: {
        error: { type: "string" },
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
    await ssoService.preRegister("EmailPasswordSignUpStrategy", {
      email: request.body.email,
    });

    return { status: "ok" };
  },
  schema,
});
