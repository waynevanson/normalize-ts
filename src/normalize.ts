import {
  LazyEntity,
  RecordData,
  Relationships,
  makeEntity,
  Entity,
} from "./entity";
import { makeSchema } from "./schema";
import { Optional } from "monocle-ts";
import { Normalized, Denormalized, DenormalizedData } from "./set";
import {
  option as O,
  record as RC,
  ord as ORD,
  array as A,
  monoid as M,
} from "fp-ts";
import { DictionaryData } from "./normalizr";
import { pipe } from "fp-ts/lib/function";
import * as _normalizr from "normalizr";
import { Ord } from "fp-ts/lib/Ord";

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
        // if not an option, make an option
        const fromdenormalized: Normalized = pipe(
          _normalizr.normalize(data, normalizrSchema).entities,
          //@ts-ignore
          RC.map(RC.compact)
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
  return normalize(schema, ord) as any;
}

type User = { id: string };
type Post = { id: string; author: User; collaborators: User[] };

const users = () => makeEntity<User>()({});

const posts = () =>
  makeEntity<Post>()({
    author: users,
    collaborators: [users],
  });

type NormalizeRecordData<
  T extends RecordData,
  R extends Relationships,
  S extends SchemaBase
> = {
  [P in keyof T]: P extends keyof R
    ? T[P] extends Array<any>
      ? string[]
      : string
    : T[P];
};

type NormalizedMap<
  T extends RecordData,
  R extends Relationships,
  S extends SchemaBase
> = {
  [P in keyof S]: Record<string, NormalizeRecordData<T, R, S>>;
};

type NormalizeResult<S extends SchemaBase> = {
  [P in keyof S]: S[P] extends LazyEntity<infer T, infer R>
    ? Optional<NormalizedMap<T, R, S>, Array<T>>
    : never;
};

type TEST = NormalizeResult<typeof schema>["posts"]["getOption"];
