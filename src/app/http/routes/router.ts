import { SsoService } from "../../../services/sso/internal/sso";
import * as sso from "../handlers/sso";
import { Handler } from "../server";
import { ENDPOINTS } from "./endpoints";

export type RouterType = Record<
  (typeof ENDPOINTS)[keyof typeof ENDPOINTS],
  Partial<
    Record<
      "POST" | "GET" | "PUT" | "DELETE",
      {
        schema: Record<string, unknown>;
        handler: Handler<any>;
      }
    >
  >
>;

export const HttpRouter = (ssoService: SsoService): RouterType => {
  return {
    [ENDPOINTS.root]: {
      GET: {
        handler: () => {},
        schema: {},
      },
    },
    [ENDPOINTS.userSignUpEmailPassword]: {
      POST: sso.user.signUp.email.password.verify.handlerFactory(ssoService),
    },
  };
};
