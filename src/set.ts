import { DictionaryData, NormalizrRelationships } from "./normalizr";
import { pipe } from "fp-ts/lib/function";
import { reader as R } from "fp-ts";
import { normalize } from "./normalizr";
import { RecordData } from "./entity";

export interface Dictionary extends Record<string, DictionaryData> {}
export interface Normalized extends Record<string, Dictionary> {}

export interface DenormalizedData extends RecordData {}
export interface Denormalized extends Array<DenormalizedData> {}

export interface Deps {
  normalized: Normalized;
  resolvers: NormalizrRelationships;
}

// return Normalize
export function set(plural: string) {}
