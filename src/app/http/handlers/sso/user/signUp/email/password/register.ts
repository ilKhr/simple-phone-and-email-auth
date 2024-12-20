import { FromSchema, JSONSchema } from "json-schema-to-ts";
import { SsoService } from "../../../../../../../../services/sso/internal/sso";
import { Handler } from "../../../../../../server";

export const schema = {
  type: "object",
  required: ["body", "response"],
  properties: {
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
): Handler<FromSchema<typeof schema>> => {
  return async (request, reply) => {
    const sessionId = await ssoService.register(
      "EmailPasswordSignUpStrategy",
      request.body
    );

    reply
      .setCookie("sessionId", sessionId, {
        httpOnly: true,
        maxAge: 1,
      })
      .send({ status: "ok" });
  };
};
