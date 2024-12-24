import { IdRequired } from "src/utils/types";

export const checkHasId = <T extends { getId: () => number | string | null }>(
  e: T
  //@ts-ignore
): e is IdRequired<T> => !!e.getId();
