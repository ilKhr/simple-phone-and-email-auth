import { SsoService } from "../../../services/sso/internal/sso";
import * as sso from "../handlers/sso";
import { ENDPOINTS } from "./endpoints";

export type RouterType = Record<
  ENDPOINTS,
  Partial<
    Record<
      "POST" | "GET" | "PUT" | "DELETE",
      {
        schema: Record<string, unknown>;
        handler: (req: any, res: any) => Promise<any> | any;
      }
    >
  >
>;

export const HttpRouter = (ssoService: SsoService): RouterType => ({
  [ENDPOINTS.userSignUpEmailPasswordRegister]: {
    POST: sso.user.signUp.email.password.register.handlerFactory(ssoService),
  },
  [ENDPOINTS.userSignUpEmailPasswordVerify]: {
    POST: sso.user.signUp.email.password.verify.handlerFactory(ssoService),
  },
});
