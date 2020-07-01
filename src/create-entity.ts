export type ID = { id: string };

export type EntitiableKeys<T extends ID> = {
  [P in keyof T]: T[P] extends ID | ID[] ? P : never;
}[keyof T];

export type RequiredKeys<T extends object> = NonNullable<
  {
    [P in keyof T]: Partial<T>[P] extends T[P] ? never : P;
  }[keyof T]
>;

export type Resolvers<A extends ID, K extends EntitiableKeys<A>> = {
  [P in K]: A[P] extends (infer U)[]
    ? U extends ID
      ? [Entity<U, any>]
      : never
    : A[P] extends ID
    ? Entity<A[P], any>
    : never;
};

export interface Entity<A extends ID, K extends EntitiableKeys<A> = never> {
  _A: A;
  _tag: "Entity";
  resolvers: () => Resolvers<A, K>;
}

export function createEntity<A extends ID, K extends EntitiableKeys<A> = never>(
  resolvers = () => ({} as Resolvers<A, K>)
) {
  return { _tag: "Entity", resolvers } as Entity<A, K>;
}
