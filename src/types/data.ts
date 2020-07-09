/**
 * @description
 * Types for changing the shape of data
 */

import { either as E } from "fp-ts";
import { EntityConstructed, OneOrMany } from "./entity";
import { SchemaBase } from "./schema";
import { RecordUnknown } from "./util";

// FLATTENED - T FROM PLURAL.GET

/**
 * @summary
 * A value of a resolvable property that is possibly circular
 * in relation to the root (top-level) entity.
 *
 * Returns `Left` with the index if circular,
 * otherwise returns `Right` with no changes.
 */
export type Circular<T extends RecordUnknown, I> = E.Either<I, T>;

export type DataFlattenedValueBase<I> =
  | DataFlattenedBase<I>
  | DataFlattenedBase<I>[]
  | Circular<any, I>
  | Circular<any, I>[];

/**
 * @summary
 * If not `RecordAny`, the flattened data may contain any of these values,
 * possibly recursing.
 */
export type DataFlattenedBase<I> = {
  [x: string]: DataFlattenedValueBase<I>;
};

/**
 * @summary
 * Flattens the data into how the user will retrieve the data.
 *
 * @todo
 * Implement recursive directly,
 * checking if it is it's own parent
 * and returning `Circular`.
 *
 * @todo
 * Implement recurive indirectly later.
 *
 * @typedef C
 */
export type DataFlatten<T extends RecordUnknown, S extends SchemaBase> = {
  // no we got the entity, we can figure out
  [P in keyof T]: EntityConstructedFromType<
    T[P] extends RecordUnknown ? T[P] : never,
    S
  > extends EntityConstructed<
    T,
    any,
    // array of relationships
    infer R
  >
    ? R extends OneOrMany<infer U>
      ? U
      : never
    : T[P];
};

// UTILITIES

/**
 * @summary
 * Retrieve the entity constructed from a schema using it's data type `T`.
 */
export type EntityConstructedFromType<
  T extends RecordUnknown,
  S extends SchemaBase
> = {
  [P in keyof S]: [S[P]] extends [EntityConstructed<infer U, any, any>]
    ? T extends U
      ? U extends T
        ? S[P]
        : never
      : never
    : never;
}[keyof S];
