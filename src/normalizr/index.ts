/**
 * @summary
 * The goal is to generate the names later.
 *
 * getting all fields requires an order if it's to be an array.
 */
import { option as O } from "fp-ts";
import { Lens } from "monocle-ts";
import * as _normalizr from "normalizr";
import { schema as _schema } from "normalizr";
import { RecordData } from "../entity";
import { Normalized } from "../set";

export interface NormalizrEntity extends _schema.Entity {}

export interface NormalizrRelationships
  extends Record<string, NormalizrEntity | [NormalizrEntity]> {}

/**
 * @summary
 * The information required to create an `Entity`
 */
export interface NormalizrEntityParams {
  /**
   * @summary
   * The _UNIQUE_ name for the normalized data.
   */
  name: string;
  relationships?: NormalizrRelationships;
  lens?: Lens<RecordData, string>;
}

// this is internal for normalizr only.
export function makeNormalizrEntity({
  name,
  relationships = {},
  lens = Lens.fromProp<any>()("id"),
}: NormalizrEntityParams): NormalizrEntity {
  return new _schema.Entity(name, relationships, {
    idAttribute: lens.get,
    mergeStrategy: (x, y) => O.some(y),
    processStrategy: (value) => O.some(value),
    //@ts-expect-error
    fallbackStrategy: (key, schema) => O.none,
  });
}

export interface NormalizrSchema
  extends Record<string, NormalizrEntity | [NormalizrEntity]> {}

// set
export function normalize(data: Record<string, Array<RecordData>>) {
  return (schema: NormalizrSchema) => _normalizr.normalize(data, schema);
}

export type DictionaryData = RecordData;

// get
// keep in mind that this has the plural property in it.
export function denormalize(data: Record<string, Record<string, RecordData>>) {
  return (schema: NormalizrSchema, normalized: Normalized) =>
    _normalizr.denormalize(data, schema, normalized);
}
