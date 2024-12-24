interface Hasher {
  hash: (p: string, saltRounds: number) => Promise<string>;
  compare: (p: string, h: string) => Promise<boolean>;
}

interface GeneralParams {
  hasher: Hasher;
}

const hash = async (gp: GeneralParams, password: string): Promise<string> => {
  const saltRounds = 10;
  return gp.hasher.hash(password, saltRounds);
};

const compare = async (
  gp: GeneralParams,
  password: string,
  hash: string
): Promise<boolean> => {
  return gp.hasher.compare(password, hash);
};

export const PasswordService = (gp: GeneralParams) => ({
  hash: (password: string) => hash(gp, password),
  compare: (password: string, hash: string) => compare(gp, password, hash),
});
