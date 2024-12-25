import { Handler, ServerSchema } from "src/app/http/server";

type OidcProvider = {
  callback: () => Handler<typeof schema>;
};

export const schema = {
  querystring: {
    type: "object",
    properties: {
      response_type: { type: "string", enum: ["code", "token", "id_token"] },
      client_id: { type: "string" },
      redirect_uri: { type: "string", format: "uri" },
      scope: { type: "string" },
      state: { type: "string" },
      nonce: { type: "string" },
      code_challenge: { type: "string" },
      code_challenge_method: { type: "string", enum: ["S256", "plain"] },
    },
    required: ["response_type", "client_id", "redirect_uri", "scope", "state"],
    additionalProperties: false,
  },
  response: {
    302: {
      type: "object",
      properties: {},
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
  oidc: OidcProvider
): {
  handler: Handler<typeof schema>;
  schema: typeof schema;
} => ({
  handler: oidc.callback(),
  schema,
});
