import { ServerSchema, Handler } from "src/app/http/server";
import { SsoService } from "src/services/sso/internal/sso";

const schema = {
  description: "Verify user phone",
  body: {
    type: "object",
    required: ["phone"],
    properties: {
      phone: {
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
        message: { type: "string" },
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
    await ssoService.preRegister("PhonePasswordSignUpStrategy", {
      phone: request.body.phone,
    });

    return { status: "ok" };
  },
  schema,
});
