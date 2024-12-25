import { ENDPOINTS } from "src/app/http/routes/endpoints";
import { SsoService } from "src/services/sso/internal/sso";
import * as sso from "src/app/http/handlers/sso";

type OidcProvider = {
  callback: () => (req: any, res: any) => Promise<any> | any;
};

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

export const HttpRouter = (
  ssoService: SsoService,
  oidcProvider: OidcProvider
): RouterType => ({
  [ENDPOINTS.userSignUpEmailPasswordRegister]: {
    POST: sso.user.signUp.email.password.register.handlerFactory(ssoService),
  },
  [ENDPOINTS.userSignUpEmailPasswordVerify]: {
    POST: sso.user.signUp.email.password.verify.handlerFactory(ssoService),
  },
  [ENDPOINTS.authorization]: {
    GET: sso.oidc.auth.get.handlerFactory(oidcProvider),
    POST: sso.oidc.auth.post.handlerFactory(oidcProvider),
  },
  [ENDPOINTS.backchannelAuthentication]: {
    POST: sso.oidc.backchannel.post.handlerFactory(oidcProvider),
  },
  [ENDPOINTS.codeVerification]: {
    POST: () => {},
    GET: () => {},
  },
  [ENDPOINTS.deviceAuthorization]: {
    POST: () => {},
    OPTIONS: () => {},
  },
  [ENDPOINTS.endSession]: {
    POST: () => {},
    GET: () => {},
  },
  [ENDPOINTS.endSessionSuccess]: {
    GET: () => {},
  },
  [ENDPOINTS.introspection]: {
    POST: () => {},
    OPTIONS: () => {},
  },
  [ENDPOINTS.jwks]: {
    GET: () => {},
    OPTIONS: () => {},
  },
  [ENDPOINTS.pushedAuthorizationRequest]: {
    POST: () => {},
    OPTIONS: () => {},
  },
  [ENDPOINTS.registration]: {
    // configuration.features.registration.enabled
    POST: () => {},
    GET: () => {},
    // configuration.features.registrationManagement.enabled
    PUT: () => {},
    DELETE: () => {},
  },
  [ENDPOINTS.revocation]: {
    // configuration.features.revocation.enabled
    POST: () => {},
    OPTIONS: () => {},
  },
  [ENDPOINTS.token]: {
    POST: () => {},
    OPTIONS: () => {},
  },
  [ENDPOINTS.userinfo]: {
    // configuration.features.userinfo.enabled
    GET: () => {},
    POST: () => {},
    OPTIONS: () => {},
  },
});
