import { phone as phoneWorker } from "phone";
import { PhoneMessage } from "src/services/messageProvider/messageProvider";

interface Sender {
  send: (mess: PhoneMessage) => Promise<boolean>;
}

type Providers = Record<"RU", Sender>;

type GeneralParams = {
  providers: Providers;
};

const getProvider = (providers: Providers, phone: string) => {
  const { isValid, countryIso2 } = phoneWorker(phone);

  if (!isValid) {
    throw new Error("Invalid phone");
  }

  const provider =
    countryIso2 in providers
      ? providers[countryIso2 as keyof typeof providers]
      : false;

  if (!provider) {
    throw new Error("Provider not exists for targer county number");
  }

  return provider;
};

export const PhoneCountyProvidersResolver = (gp: GeneralParams) => {
  const providers = gp.providers;

  return {
    send: async (mess: PhoneMessage) => {
      const provider = getProvider(providers, mess.to);

      await provider.send(mess);

      return true;
    },
  };
};
