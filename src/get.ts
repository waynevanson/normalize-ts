import { pipe } from "fp-ts/lib/function";
import { URIS, Kind } from "fp-ts/lib/HKT";
import { Monad1 } from "fp-ts/lib/Monad";
import {
  PipeableChain1,
  PipeableFoldableWithIndex1,
  PipeableFunctorWithIndex1,
} from "fp-ts/lib/pipeable";
import { TraversableWithIndex1 } from "fp-ts/lib/TraversableWithIndex";
} from "../schema";
import { Normalize } from "./normalize";

export type DepsFaFap<F extends URIS, I> = {
  fa: TraversableWithIndex1<F, I> & Monad1<F>;
  fap: PipeableChain1<F> &
    PipeableFunctorWithIndex1<F, I> &
    PipeableFoldableWithIndex1<F, I>;
};

export type DepsInternal<F extends URIS, S extends SchemaBase> = {
  schemaInternal: SchemaInternal<S>;
  normalized: Normalize<S, F>;
};

export type DepsSingle<
  T extends Record<string, any>,
  D,
  L extends PairInternal<T, any, string>[]
> = {
  plural: string;
  entity: EntityInternal<T, D, L>;
};

export type DepsIndexToValue<
  F extends URIS,
  I,
  S extends SchemaBase,
  T extends Record<string, any>,
  D,
  L extends PairInternal<T, any, string>[]
> = DepsInternal<F, S> & DepsFaFap<F, I> & DepsSingle<T, D, L>;

/**
 * Resolve a single index.
 */
export function indexToValue<
  F extends URIS,
  I,
  S extends SchemaBase,
  T extends Record<string, any>,
  D,
  L extends PairInternal<T, any, string>[]
>(plural: string, index: I, dictionary: Kind<F, T>) {
  return ({
    fa,
    fap,
    schemaInternal,
    normalized,
  }: DepsIndexToValue<F, I, S, T, D, L>): TV.TheseV<T> => pipe(index, (a) => a);
}
