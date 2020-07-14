import { either, monoid, semigroup, show, array as A } from "fp-ts";
import { pipeable } from "fp-ts/lib/pipeable";

export type EitherV<A> = either.Either<unknown, A>;

const monoidUnknown = A.getMonoid<unknown>();
export const eitherV = either.getValidation(monoidUnknown);

export const getMonoid = <A>(MA: monoid.Monoid<A>) =>
  either.getValidationMonoid(monoidUnknown, MA);

export const getSemigroup = <A>(SA: semigroup.Semigroup<A>) =>
  either.getValidationSemigroup(monoidUnknown, SA);

export const {
  alt,
  ap,
  apFirst,
  apSecond,
  chainFirst,
  chain,
  duplicate,
  extend,
  filterOrElse,
  flatten,
  fromPredicate,
  foldMap,
  fromEither,
  fromOption,
  map,
  reduce,
  reduceRight,
} = pipeable(eitherV);
