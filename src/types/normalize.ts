/**
 * @summary
 * Contains types for the normalize function.
 *
 * Also contains types for commonalities between the `get` and `set` modules.
 */
import { SchemaBase } from "./schema";
import { URIS, Kind, HKT } from "fp-ts/lib/HKT";
import { EntityConstructed } from "./entity";
import { DataFlatten, DataNormalized } from "./data";
import { RecordUnknown } from "./util";
import { Lens } from "monocle-ts";

/**
 * @summary
 * The type that is associated with the dictionary.
 * It holds all the values for the given type.
 */
export type Normalize<S extends SchemaBase, F extends URIS> = {
  [P in keyof S]: S[P] extends EntityConstructed<infer A, any, any>
    ? Kind<F, DataFlatten<A, S>>
    : never;
};

export type NormalizeResult = {};

export type TransformFunction<F extends URIS, G> = <
  T extends Record<string, any>
>(
  lens: Lens<T, unknown>
) => Lens<Kind<F, T>, HKT<G, T>>;

/**
 * @summary
 *
 */
export type DictionaryNormalized<
  F extends URIS,
  S extends SchemaBase,
  T extends RecordUnknown
> = Kind<F, DataNormalized<T, S>>;
