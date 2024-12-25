import { Handler, ServerSchema } from "src/app/http/server";

type OidcProvider = {
  callback: () => Handler<typeof schema>;
};

export const schema = {
  body: {
    type: "object",
    properties: {
      username: { type: "string" },
      password: { type: "string" },
      scope: { type: "string" },
      client_id: { type: "string" },
      redirect_uri: { type: "string", format: "uri" },
      state: { type: "string" },
    },
    required: ["username", "password", "client_id", "redirect_uri", "scope"],
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        token_type: { type: "string" },
        expires_in: { type: "number" },
        refresh_token: { type: "string" },
        scope: { type: "string" },
      },
      required: ["access_token", "token_type", "expires_in"],
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
