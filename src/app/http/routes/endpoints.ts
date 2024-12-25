export enum ENDPOINTS {
  userSignUpEmailPasswordRegister = "/sso/user/signUp/email-password/register",
  userSignUpEmailPasswordVerify = "/sso/user/signUp/email-password/verify",
  authorization = "/oidc/auth",
  backchannelAuthentication = "/oidc/backchannel",
  codeVerification = "/oidc/device",
  deviceAuthorization = "/oidc/device/oidc/auth",
  endSession = "/oidc/session/oidc/end",
  endSessionSuccess = "/oidc/session/oidc/end/success",
  introspection = "/oidc/token/oidc/introspection",
  jwks = "/oidc/jwks",
  pushedAuthorizationRequest = "/oidc/request",
  registration = "/oidc/reg",
  revocation = "/oidc/token/oidc/revocation",
  token = "/oidc/token",
  userinfo = "/oidc/me",
}
