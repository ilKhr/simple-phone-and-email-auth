import { FromSchema, JSONSchema } from "json-schema-to-ts";
import { SsoService } from "../../../../../../../../services/sso/internal/sso";
import { Handler } from "../../../../../../server";

const schema = {
  type: "object",
  required: ["body", "response"],
  properties: {
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
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

export const handlerFactory = (
  ssoService: SsoService
): { handler: Handler<FromSchema<typeof schema>>; schema: typeof schema } => ({
  handler: async (request, reply) => {
    await ssoService.preRegister("EmailPasswordSignUpStrategy", {
      email: request.body.email,
    });

    reply.send({ status: "ok" });
  },
  schema,
});
