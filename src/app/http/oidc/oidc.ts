//@ts-ignore
import { Configuration } from "oidc-provider";
import { UserWithId } from "src/services/sso/internal/entities/user";

interface UserProvider {
  byId: (id: number) => Promise<UserWithId | null>;
}

export const OidcProviderCreate = async (
  issuer: string,
  userProvider: UserProvider
) => {
  const { default: Provider } = await import("oidc-provider");

  const oidcConfig: Configuration = {
    clients: [
      {
        client_id: "client-id",
        client_secret: "client-secret",
        grant_types: ["authorization_code", "refresh_token"],
        redirect_uris: ["http://localhost:3000/callback"],
      },
    ],
    cookies: {
      keys: ["abcd"],
    },
    ttl: {
      AccessToken: 3600, // Время жизни access-токена (в секундах)
      RefreshToken: 86400 * 30, // Время жизни refresh-токена (30 дней)
    },
    findAccount: async (_, sub, token) => {
      if (!isFinite(Number(sub))) {
        throw new Error("Sub is not a number");
      }

      const user = await userProvider.byId(Number(sub));

      if (!user) {
        return undefined;
      }

      return {
        accountId: sub,
        claims: async (use, scope, claims, rejected) => ({
          sub: String(user.getId()),
          email: user.getEmail(),
        }),
      };
    },
  };

  return new Provider(issuer, oidcConfig);
};
