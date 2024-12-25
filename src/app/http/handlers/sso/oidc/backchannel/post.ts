import { Handler, ServerSchema } from "src/app/http/server";

type OidcProvider = {
  callback: () => Handler<typeof schema>;
};

export const schema = {
  body: {
    type: "object",
    properties: {
      client_id: { type: "string" },
      client_secret: { type: "string" },
      scope: { type: "string" },
      login_hint: { type: "string" },
      acr_values: { type: "string" },
      binding_message: { type: "string" },
      user_code: { type: "string" },
      request: { type: "string" },
    },
    required: ["client_id", "scope", "login_hint"],
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        auth_req_id: { type: "string" },
        expires_in: { type: "number" },
        interval: { type: "number" },
      },
      required: ["auth_req_id", "expires_in", "interval"],
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
