import { Handler, ServerSchema } from "src/app/http/server";

type OidcProvider = {
  callback: () => Handler<typeof schema>;
};

export const schema = {
  body: {
    type: "object",
    properties: {
      client_id: { type: "string" },
      scope: { type: "string" },
      audience: { type: "string" },
    },
    required: ["client_id", "scope"],
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        device_code: { type: "string" },
        user_code: { type: "string" },
        verification_uri: { type: "string", format: "uri" },
        verification_uri_complete: { type: "string", format: "uri" },
        expires_in: { type: "number" },
        interval: { type: "number" },
      },
      required: ["device_code", "user_code", "verification_uri", "expires_in"],
      additionalProperties: false,
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" },
        error_description: { type: "string" },
      },
      required: ["error"],
      additionalProperties: false,
    },
  },
} as const satisfies ServerSchema;

export const handlerFactory = (
  oidcProvider: OidcProvider
): {
  handler: Handler<typeof schema>;
  schema: typeof schema;
} => ({
  handler: oidcProvider.callback(),
  schema,
});
