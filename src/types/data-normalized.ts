/**
 * @description
 * Data normalized is the type that is held in the dictionary.
 */

import { Lens } from "monocle-ts";
import { EntityConstructedFromType } from "./data";
import { Entity, EntityConstructed } from "./entity";
import { SchemaBase } from "./schema";
import { ExtractArray, RecordUnknown } from "./util";

// NORMALIZED - T IN DICTIONARY

export type RelationshipsFromEntityConstructed<
  T extends EntityConstructed<T, any, any>
> = ReturnType<T> extends Entity<T, any, any>
  ? ReturnType<T>["relationships"]
  : never;

export type RinDataNormalizedValue<T, S extends SchemaBase> = ExtractArray<
  RelationshipsFromEntityConstructed<EntityConstructedFromType<T, S>>
>;

export type DataNormalizedValue<
  T,
  S extends SchemaBase,
  R extends RinDataNormalizedValue<T, S>
> = T extends RecordUnknown
  ? Extract<R, [Lens<any, T[]>, any]> extends any
    ? string
    : DataNormalized<T, S>
  : T;

/**
 * @summary
 * The value will be a string or a string[] of it's a resolvable
 */
export type DataNormalized<
  T extends RecordUnknown,
  S extends SchemaBase,
  R extends RinDataNormalizedValue<T, S> = RinDataNormalizedValue<T, S>
> = {
  [P in keyof T]: T[P] extends Array<infer U>
    ? Array<DataNormalizedValue<U, S, R>>
    : T[P] extends RecordUnknown
    ? DataNormalizedValue<T[P], S, R>
    : T[P];
};
