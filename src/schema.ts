/**
 * @description
 * Get a pair of relationships and make it work.
 */

import { NormalizrEntity, makeNormalizrEntity } from "./normalizr";
import { LazyEntity, RecordData, Relationships } from "./entity";
import { pipe } from "fp-ts/lib/function";
import { record as RC, either as E, option as O, array as A } from "fp-ts";
import { Lens } from "monocle-ts";
import { isatty } from "tty";

export function isArray<T>(a: T): a is Extract<T, Array<any>> {
  return Array.isArray(a);
}

export function eSplitArray<T>(
  a: T
): E.Either<Exclude<T, Array<any>>, Extract<T, Array<any>>> {
  return pipe(
    a,
    E.fromPredicate(isArray, (a) => a as Exclude<T, Array<any>>)
  );
}

export function enforceArray<T>(a: T | T[]): T[] {
  return Array.isArray(a) ? a : [a];
}

export function enforceNotTuplet<T>(a: T | [T]): T {
  return Array.isArray(a) ? a[0] : a;
}

export interface Resolver<T extends RecordData> {
  lens: Lens<T, string>;
  type: "One" | "Many";
  plural: string;
  from: string;
  to: string;
  entity: NormalizrEntity;
}

// lazy entities can be compared.
export function makeSchema(
  entities: Record<string, LazyEntity<RecordData, Relationships>>
) {
  return pipe(
    entities,
    RC.mapWithIndex((plural, lazyEntity) =>
      pipe(lazyEntity(), ({ relationships, lens }) =>
        pipe(
          relationships,
          RC.filterMap(O.fromNullable),
          RC.collect(
            (from, aRelationship): O.Option<Resolver<RecordData>> =>
              pipe(
                enforceNotTuplet<LazyEntity<RecordData, any>>(aRelationship),
                (lazy) => RC()
              )
          )
        )
      )
    )
  );
}

export interface Schema<S> {
  _S: S;
  // normalizr relationships
  entities: Record<string, NormalizrEntity>;
}
