import { phone as phoneWorker } from "phone";
import { PhoneMessage } from "src/services/messageProvider/messageProvider";
import { CustomError } from "src/utils/error";

interface Sender {
  send: (mess: PhoneMessage) => Promise<boolean>;
}

type Providers = Record<"RU", Sender[]>;

type GeneralParams = {
  providers: Providers;
};

const getProvider = (providers: Providers, phone: string) => {
  const { isValid, countryIso2 } = phoneWorker(phone);

  if (!isValid) {
    throw new CustomError("Invalid phone");
  }

  const provider =
    countryIso2 in providers
      ? providers[countryIso2 as keyof typeof providers]
      : false;

  if (!provider) {
    throw new CustomError("Provider not exists for targer county number");
  }

  return provider;
};

export const PhoneCountyProvidersResolver = (gp: GeneralParams) => {
  const countryProviders = gp.providers;

  return {
    send: async (mess: PhoneMessage) => {
      const localProvicers = getProvider(countryProviders, mess.to);

      for (const provider of localProvicers) {
        try {
          await provider.send(mess);
          break;
        } catch (e) {}
      }

      return true;
    },
  };
};
