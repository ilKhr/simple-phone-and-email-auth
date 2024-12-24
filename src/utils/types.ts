export type IdRequired<T> = T extends { getId: () => infer R }
  ? Omit<T, "getId"> & { getId: () => Exclude<R, null> }
  : never;
