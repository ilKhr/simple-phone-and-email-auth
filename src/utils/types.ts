export type IdRequired<T> = T extends { getId: () => string | null }
  ? Omit<T, "getId"> & { getId: () => string }
  : never;
