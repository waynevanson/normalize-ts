import { semigroup, show, these as T } from "fp-ts";
import { pipeable } from "fp-ts/lib/pipeable";
import { Infos, monoidInfos, showInfos } from "./either-v/info";

export type TheseV<A> = T.These<Infos, A>;

export const theseV = T.getMonad(monoidInfos);

export const getSemigroup = <A>(SA: semigroup.Semigroup<A>) =>
  T.getSemigroup(monoidInfos, SA);

export const getShow = <A>(SA: show.Show<A>) => T.getShow(showInfos, SA);

export const {
  ap,
  apFirst,
  apSecond,
  chainFirst,
  chain,
  filterOrElse,
  flatten,
  fromPredicate,
  fromEither,
  fromOption,
  map,
} = pipeable(theseV);
