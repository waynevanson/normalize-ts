/**
 * A tuplet is a nonempty, single index array.
 *
 * It always holds one value.
 */
import { array, either } from "fp-ts";
import { Applicative1 } from "fp-ts/lib/Applicative";
import { Chain1 } from "fp-ts/lib/Chain";
import { FunctorWithIndex1 } from "fp-ts/lib/FunctorWithIndex";
import { pipe, pipeable } from "fp-ts/lib/pipeable";

export type Tuplet<T> = [T];

export const URI = "Tuplet";
export type URI = typeof URI;

declare module "fp-ts/lib/HKT" {
  export interface URItoKind<A> {
    readonly Tuplet: Tuplet<A>;
  }
}
export type EnforceTuplet<T> = Extract<T, Tuplet<any>>;
export type EnforceNotTuplet<T> = Exclude<T, Tuplet<any>>;

/**
 * @summary
 * A refinement asserting if `a` is a tuplet.
 */
export function isTuplet<T>(a: T | Tuplet<T>): a is Tuplet<T> {
  return Array.isArray(a) && array.isOutOfBound(1, a);
}

/**
 * @summary
 * A refinement asserting if `a` is not a tuplet.
 */
export function isNotTuplet<T>(a: T | Tuplet<T>): a is T {
  return !isTuplet(a);
}

/**
 * @summary
 * Folds a tuplet.
 */
export function fold<T>(fa: Tuplet<T>): T {
  return fa[0];
}

/**
 * @summary
 * Conditionally folds `a` if it is a tuplet.
 */
export function enforceNotTuplet<T>(a: T | Tuplet<T>) {
  return pipe(
    a,
    either.fromPredicate(isNotTuplet, (a) => a as [T]),
    either.getOrElse(fold)
  );
}

/**
 * @summary
 * Conditionally lifts `a` if it is not a tuplet.
 */
export function enforceTuplet<T>(a: T) {
  return pipe(a, enforceNotTuplet, tuplet.of);
}

export const tuplet: Chain1<URI> &
  Applicative1<URI> &
  FunctorWithIndex1<URI, 0> = {
  URI,
  map(fa, f) {
    return pipe(fa, fold, f, tuplet.of);
  },
  ap(fab, fa) {
    return pipe(fa, fold, fab[0], tuplet.of);
  },
  chain(fa, f) {
    return pipe(fa, fold, f);
  },
  of(a) {
    return [a];
  },
  mapWithIndex(fa, f) {
    return pipe(f(0, pipe(fa, fold)), tuplet.of);
  },
};

export const {
  ap,
  apFirst,
  apSecond,
  chain,
  chainFirst,
  flatten,
  map,
  mapWithIndex,
} = pipeable(tuplet);
