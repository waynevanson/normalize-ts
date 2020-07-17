import {
  array as A,
  either as E,
  option as O,
  reader as R,
  readerEither as RE,
  record as RC,
} from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import {
  errorLookupDictionary,
  errorLookupNormalized,
  errorLookupResolver,
} from "./errors";
import { eitherV as EV } from "./higher-kinded-type";
import { Dictionary, NormalizeDeps } from "./normalize";
import { Resolver, ResolverMany, ResolverOne } from "./schema";
import { oNumber, oNumberArray } from "./util";

export const retrieveResolver = (plural: string, from: string) =>
  A.findFirst((a: Resolver) => a.from === from && a.plural == plural);

export const eResolverType = E.fromPredicate(
  (a: Resolver): a is ResolverOne => a.type === "One",
  (a) => a as ResolverMany
);

export function recurseResolverCommon(to: string) {
  return pipe(
    RE.asks(({ normalized }: NormalizeDeps) => normalized),
    R.map(
      E.chain(
        flow(
          RC.lookup(to),
          EV.fromOption(() => errorLookupResolver(to))
        )
      )
    )
  );
}

export function oRecurseResolverOne({ to }: ResolverOne) {
  return flow(
    oNumber,
    O.map((index) =>
      pipe(
        recurseResolverCommon(to),
        RE.chain((dictionary) => getOptionInner(index, to, dictionary))
      )
    )
  );
}

export function oRecurseResolverMany({ to }: ResolverMany) {
  return flow(
    oNumberArray,
    O.map((indicies) =>
      pipe(
        recurseResolverCommon(to),
        RE.chain((dictionary) =>
          pipe(
            indicies,
            A.map((index) => getOptionInner(index, to, dictionary)),
            A.sequence(R.reader),
            R.map(A.sequence(EV.eitherV))
          )
        )
      )
    )
  );
}

export function getOptionInner(
  index: number,
  plural: string,
  dictionary: Dictionary
): RE.ReaderEither<NormalizeDeps, Array<unknown>, unknown> {
  return pipe(
    dictionary,
    A.lookup(index),
    EV.fromOption(() => errorLookupDictionary(index, plural)),
    RE.fromEither,
    RE.map(
      RC.mapWithIndex((from, value) =>
        pipe(
          RE.asks(({ resolvers }: NormalizeDeps) => resolvers),
          RE.map(retrieveResolver(plural, from)),
          RE.map(
            flow(
              O.map(eResolverType),
              O.map(E.fold(oRecurseResolverMany, oRecurseResolverOne)),
              O.getOrElse(() => value)
            )
          )
        )
      )
    )
  );
}

export function getOptionMain(plural: string) {
  return pipe(
    RE.asks((deps: NormalizeDeps) => deps.normalized),
    RE.chain(
      flow(
        RC.lookup(plural),
        EV.fromOption(() => errorLookupNormalized(plural)),
        RE.fromEither,
        RE.chain((dictionary) =>
          pipe(
            dictionary,
            A.mapWithIndex((index) =>
              getOptionInner(index, plural, dictionary)
            ),
            A.sequence(RE.readerEither)
          )
        )
      )
    )
  );
}
