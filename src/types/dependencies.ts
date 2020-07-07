/**
 * Dependencies used for `Reader` types.
 * Join these together via intersection.
 */

import { URIS } from "fp-ts/lib/HKT";
import { TraversableWithIndex1 } from "fp-ts/lib/TraversableWithIndex";
import { Monad1 } from "fp-ts/lib/Monad";
import {
  PipeableChain1,
  PipeableFunctorWithIndex1,
  PipeableFoldableWithIndex1,
} from "fp-ts/lib/pipeable";

/**
 * @summary
 * The HKT used to store values, like a dictionary.
 *
 * Works well as an array but users usually try to use a `Record<string,T>`.
 */
export type FA<F extends URIS, I> = TraversableWithIndex1<F, I> & Monad1<F>;

/**
 * @summary
 * Same as FA, but from pipeable.
 */
export type FAP<F extends URIS, I> = PipeableChain1<F> &
  PipeableFunctorWithIndex1<F, I> &
  PipeableFoldableWithIndex1<F, I>;

/**
 * @summary
 * A dependency that holds piped and non piped of our required HKT
 */
export type DepsFI<F extends URIS, I> = {
  fa: FA<F, I>;
  fap: FAP<F, I>;
};
