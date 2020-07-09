/**
 * @description
 * Types for changing the shape of data
 */

import { either as E, extend } from "fp-ts";
import {
  EntityConstructed,
  OneOrMany,
  Relationship,
  Entity,
  All,
} from "./entity";
import { SchemaBase } from "./schema";
import { RecordUnknown } from "./util";
import { Lens } from "monocle-ts";
import { makeEntity } from "..";
import { tuple } from "fp-ts/lib/function";
import { None } from "fp-ts/lib/Option";

// NORMALIZED - T IN DICTIONARY

type RelationshipsFromEntityConstructed<
  T extends EntityConstructed<T, any, any>
> = ReturnType<T> extends Entity<T, any, any>
  ? ReturnType<T>["relationships"]
  : never;

type DataNormalizedValue<
  U,
  S extends SchemaBase,
  R extends ExtractArray<
    RelationshipsFromEntityConstructed<EntityConstructedFromType<T, S>>
  >
> = U extends RecordUnknown
  ? Extract<R, [Lens<any, U[]>, any]> extends any
    ? string
    : DataNormalized<U, S>
  : U;

type ExtractArray<T extends any[]> = T extends Array<infer U> ? U : never;

/**
 * @summary
 * The value will be a string or a string[] of it's a resolvable
 */
export type DataNormalized<
  T extends RecordUnknown,
  S extends SchemaBase,
  R extends ExtractArray<
    RelationshipsFromEntityConstructed<EntityConstructedFromType<T, S>>
  > = ExtractArray<
    RelationshipsFromEntityConstructed<EntityConstructedFromType<T, S>>
  >
> = {
  [P in keyof T]: T[P] extends Array<infer U>
    ? Array<DataNormalizedValue<T, S, R>>
    : T[P] extends RecordUnknown
    ? DataNormalizedValue<T, S, R>
    : T[P];
};

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

export type DataFlattenedValueBase =
  | DataFlattenedBase
  | DataFlattenedBase[]
  | Circular<any, any>
  | Circular<any, any>[];

/**
 * @summary
 * If not `RecordAny`, the flattened data may contain any of these values,
 * possibly recursing.
 */
export type DataFlattenedBase = {
  [x: string]: DataFlattenedValueBase;
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
