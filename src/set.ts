import {
  array as A,
  reader as R,
  readerEither as RE,
  record as RC,
  either as E,
  option as O,
  tuple as TP,
} from "fp-ts";
import { pipe, flow, tuple, tupled } from "fp-ts/lib/function";
import { errorLookupNormalized } from "./errors";
import { eitherV as EV } from "./higher-kinded-type";
import { Dictionary, NormalizeDeps } from "./normalize";
import { retrieveResolver, eResolverType } from "./get-option";
import { oNumber, isArray } from "./util";
import { RecordUnknown, RecordData } from "./entity";
import { flatten } from "fp-ts/lib/ReadonlyArray";
import { ResolverMany, ResolverOne } from "./schema";

// once looked up,
// go through each nested record, and if the from is resolvable,
// we flatten that value and continue down the recursion table.

export function isRecordDataOne(a: unknown): a is RecordData {
  return a instanceof Object && RC.hasOwnProperty("id", a);
}

export function isRecordDataMany(a: unknown): a is Array<RecordData> {
  return Array.isArray(a) && a.every(isRecordDataOne);
}

const many = (value: unknown) => ({ to }: ResolverMany) =>
  pipe(
    value,
    O.fromPredicate(isRecordDataMany),
    O.map((v) =>
      tuple(
        pipe(
          v,
          A.map((a) => a.id as unknown)
        ),
        setMain(to, v)
      )
    )
  );

const one = (value: unknown) => ({ to }: ResolverOne) =>
  pipe(
    value,
    O.fromPredicate(isRecordDataOne),
    O.map((v) => tuple(v.id as unknown, setMain(to, [v])))
  );

// this hsould be normalized, not dictionary.
export function setMain(
  plural: string,
  dictionaryNested: Dictionary
): R.Reader<NormalizeDeps, Dictionary> {
  return pipe(
    R.ask<NormalizeDeps>(),
    // shit what to do here?
    R.chain(() =>
      pipe(
        dictionaryNested,
        A.map((recordData) =>
          pipe(
            recordData,
            // value here boys
            RC.mapWithIndex((from, value) =>
              pipe(
                R.asks(({ resolvers }: NormalizeDeps) => resolvers),
                R.chain(
                  flow(
                    retrieveResolver(plural, from),
                    // if resolvable, recurse and assert
                    // that the value is the correct shape.
                    O.chain(
                      flow(eResolverType, E.fold(many(value), one(value)))
                    ),
                    O.getOrElse(() => tuple(value, R.of([] as Dictionary))),
                    TP.swap,
                    TP.sequence(R.reader)
                  )
                )
              )
            ),
            RC.sequence(R.reader),
            // get the record out of it
            R.map(
              RC.reduceWithIndex(
                [recordData, []] as [RecordData, Dictionary],
                (from, b, [dic, value]) =>
                  pipe(
                    b,
                    TP.map(RC.insertAt(from, value)),
                    TP.mapLeft(A.alt(() => dic)),
                    TP.map((a) => a as RecordData)
                  )
              )
            ),
            R.map(([rec, dic]) => A.cons(rec, dic))
          )
        ),
        A.sequence(R.reader),
        R.map(A.flatten)
      )
    )
  );
}
