import {
  EntityConstructed,
  OneOrMany,
  Resolver,
  LensPrimaryKey,
} from "./entity";
import { KeysOfValue } from "./util";

/**
 * @summary
 * The schema that the user creates,
 * used to create a generic of the user created schema.
 */
export type SchemaBase = Record<string, EntityConstructed<any, any, any>>;

/**
 * @summary
 * The result of internalizing the schema.
 */
export type SchemaInternal<S extends SchemaBase> = {
  [P in keyof S]: ReturnType<S[P]> extends {
    lensPrimaryKey: infer U;
    relationships: Array<OneOrMany<[infer R, OneOrMany<infer A>]>>;
  }
    ? {
        lensPrimaryKey: U;
        resolvers: Array<
          unknown extends A
            ? never
            : R extends any
            ? U extends LensPrimaryKey<infer T, infer O>
              ? Resolver<
                  T,
                  O,
                  KeysOfValue<S, A> extends string ? KeysOfValue<S, A> : never
                >
              : never
            : never
        >;
      }
    : never;
};
