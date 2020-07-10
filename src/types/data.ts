/**
 * @description
 * Types for changing the shape of data
 */

import { either as E } from "fp-ts";
import { EntityConstructed, OneOrMany } from "./entity";
import { SchemaBase } from "./schema";
import { RecordUnknown } from "./util";
import { RinDataNormalizedValue } from "./data-normalized";
import { Lens } from "monocle-ts";
import { makeEntity } from "../make-entity";
import { tuple } from "fp-ts/lib/function";

// FLATTENED - T FROM PLURAL.GET

/**
 * @summary
 * A value of a resolvable property that is possibly circular
 * in relation to the root (top-level) entity.
 *
 * Returns `Left` with the index if circular,
 * otherwise returns `Right` with no changes.
 *
 * @typedef T The struct
 * @typedef I Index that the value will be in.
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

type DataFlattenValue<
  T extends RecordUnknown,
  I,
  S extends SchemaBase,
  U
> = U extends RecordUnknown // circular // extends record // could go deeper.
  ? Extract<
      EntityConstructedFromType<U, S>,
      EntityConstructedFromType<T, S>
    > extends never
    ? DataFlatten<U, I, S>
    : Circular<U, I>
  : U;

/**
 * @summary
 * Flattens the data into how the user will retrieve the data.
 *
 * @todo
 * If T[P] or anything within references Entity<T, any, any>, Return Circular<T[P],I>
 *
 */
export type DataFlatten<T extends RecordUnknown, I, S extends SchemaBase> = {
  [P in keyof T]: T[P] extends Array<infer U>
    ? Array<DataFlattenValue<T, I, S, U>>
    : DataFlattenValue<T, I, S, T[P]>;
};

// UTILITIES

/**
 * @summary
 * Retrieve the entity constructed from a schema using it's data type `T`.
 *
 * @todo extract out an equals type.
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
