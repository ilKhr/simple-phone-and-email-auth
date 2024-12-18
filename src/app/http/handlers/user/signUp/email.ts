import { Handler } from "../../../server";
import { FromSchema, JSONSchema } from "json-schema-to-ts";

export const schema = {
  type: "object",
  required: ["request", "reply"],
  properties: {
    request: {
      type: "object",
      required: ["body"],
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
      },
      additionalProperties: false,
    },
    reply: {
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

export const handler: Handler<FromSchema<typeof schema>> = (request, reply) => {
  // validate email
};
