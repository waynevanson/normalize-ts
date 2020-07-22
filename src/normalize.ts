import {
  array as A,
  monoid as M,
  option as O,
  ord as ORD,
  record as RC,
} from "fp-ts";
import { pipe, flow } from "fp-ts/lib/function";
import { Ord } from "fp-ts/lib/Ord";
import { Optional } from "monocle-ts";
import * as _normalizr from "normalizr";
import { LazyEntity, RecordData, Relationships } from "./entity";
import { DictionaryData } from "./normalizr";
import { makeSchema } from "./schema";
import { Denormalized, DenormalizedData, Normalized } from "./set";

export function _normalizer(
  schema: SchemaBase,
  ord: ORD.Ord<string> = ORD.ordString
) {
  const normalizrSchema = makeSchema(schema).entities;

  const makeOptional = (plural: string) =>
    new Optional(
      (normalized: Normalized): O.Option<Denormalized> => {
        const datas = pipe(
          normalized,
          RC.filterWithIndex((k) => k === plural),
          RC.map(RC.collect((k, a) => a.id))
        );

        const result = pipe(
          _normalizr.denormalize(datas, normalizrSchema, normalized)[plural],
          RC.toArray,
          A.sort(ORD.contramap(([k]: [string, DictionaryData]) => k)(ord)),
          A.map(([, a]) => a as DenormalizedData)
        );

        return O.some(result);
      },
      // merge
      (denormalized) => (normalized) => {
        const data = { [plural]: denormalized };

        const dd = _normalizr.normalize(data, normalizrSchema);
        // if not an option, make an option
        const fromdenormalized: Normalized = pipe(
          dd.entities,
          //@ts-expect-error
          RC.map(flow(RC.map(O.fromNullable), RC.compact))
        );

        const m = RC.getMonoid(RC.getMonoid({ concat: (x, y) => y }));
        const result = M.fold(m)([normalized, fromdenormalized]);

        return result as Normalized;
      }
    );

  return pipe(normalizrSchema, RC.mapWithIndex(makeOptional));
}

type SchemaBase = Record<string, LazyEntity<RecordData, Relationships>>;

export function normalize<S extends SchemaBase>(
  schema: S,
  ord?: Ord<string>
): NormalizeResult<S> {
  return _normalizer(schema, ord) as any;
}

type NormalizeRecordData<T extends RecordData, R extends Relationships> = {
  [P in keyof T]: P extends keyof R
    ? T[P] extends Array<any>
      ? string[]
      : string
    : T[P];
};

type NormalizeResult<S extends SchemaBase> = {
  [P in keyof S]: S[P] extends LazyEntity<infer T, any>
    ? Optional<
        {
          [K in keyof S]: Record<
            string,
            S[K] extends LazyEntity<infer U, infer R>
              ? NormalizeRecordData<U, R>
              : never
          >;
        },
        Array<T>
      >
    : never;
};
