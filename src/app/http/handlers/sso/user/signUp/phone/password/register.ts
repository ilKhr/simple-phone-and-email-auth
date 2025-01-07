import { ServerSchema, Handler } from "src/app/http/server";
import { SsoService } from "src/services/sso/internal/sso";

export const schema = {
  body: {
    type: "object",
    required: ["phone", "password", "firstName", "code"],
    properties: {
      phone: {
        type: "string",
      },
      password: {
        type: "string",
      },
      firstName: {
        type: "string",
      },
      lastName: {
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
      required: ["accessToken"],
      properties: {
        accessToken: {
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
    const { accessToken, refreshToken } = await ssoService.register(
      "PhonePasswordSignUpStrategy",
      {
        info: {
          firstName: request.body.firstName,
          lastName: request.body.lastName || null,
        },
        credentials: {
          code: request.body.code,
          password: request.body.password,
          phone: request.body.phone,
        },
        device: {
          ipAddress: request.ip,
        },
      }
    );

    console.log("refreshToken", refreshToken);

    return {
      accessToken,
    };
  },
  schema,
});
