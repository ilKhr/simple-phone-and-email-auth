import { IdRequired } from "../../utils/types";

export const checkHasId = <T extends { getId: () => string | null }>(
  e: T
  //@ts-ignore
): e is IdRequired<T> => !!e.getId();
