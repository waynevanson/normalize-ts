import { either, monoid, semigroup, show } from "fp-ts";
import { pipeable } from "fp-ts/lib/pipeable";
import { Infos, monoidInfos, showInfos } from "./either-v/info";

export type EitherV<A> = either.Either<Infos, A>;

export const eitherV = either.getValidation(monoidInfos);

export const getMonoid = <A>(MA: monoid.Monoid<A>) =>
  either.getValidationMonoid(monoidInfos, MA);

export const getSemigroup = <A>(SA: semigroup.Semigroup<A>) =>
  either.getValidationSemigroup(monoidInfos, SA);

export const getShow = <A>(SA: show.Show<A>) => either.getShow(showInfos, SA);

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
