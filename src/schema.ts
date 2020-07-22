/**
 * @description
 * Get a pair of relationships and make it work.
 */

import {
  NormalizrEntity,
  makeNormalizrEntity,
  NormalizrRelationships,
} from "./normalizr";
import {
  LazyEntity,
  RecordData,
  Relationships,
  RelationshipValue,
} from "./entity";
import { pipe, tuple } from "fp-ts/lib/function";
import { record as RC, either as E, option as O, array as A } from "fp-ts";
import { Lens } from "monocle-ts";
import { recordFindIndexUniq } from "./util";

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
}

const makeResolver = (
  entities: Record<string, LazyEntity<RecordData, Relationships>>,
  lens: Lens<RecordData, string>,
  plural: string
) => (
  from: string,
  aRelationship: RelationshipValue
): O.Option<Resolver<RecordData>> =>
  pipe(enforceNotTuplet<LazyEntity<RecordData, any>>(aRelationship), (lazy) =>
    pipe(
      entities,
      recordFindIndexUniq((a) => Object.is(a, lazy)),
      O.map(
        (to): Resolver<RecordData> => ({
          from,
          lens,
          plural,
          to,
          type: isArray(aRelationship) ? "Many" : "One",
        })
      )
    )
  );

// lazy entities can be compared.
export function makeSchema<
  S extends Record<string, LazyEntity<RecordData, Relationships>>
>(entities: S): Schema<S> {
  const normalizrEntities = pipe(
    entities,
    RC.mapWithIndex((plural, lazyEntity) =>
      pipe(lazyEntity(), ({ lens }) =>
        makeNormalizrEntity({ name: plural, lens, relationships: {} })
      )
    )
  );

  const resolvers = pipe(
    entities,
    RC.mapWithIndex((plural, lazyEntity) =>
      pipe(lazyEntity(), ({ relationships, lens }) =>
        pipe(
          relationships,
          RC.filterMap(O.fromNullable),
          RC.collect(makeResolver(entities, lens, plural)),
          A.compact
        )
      )
    ),
    RC.collect((_, v) => v),
    A.flatten
  );

  // find any matching resolver and assign it's value to the thing.
  const normalizrSchema = pipe(
    normalizrEntities,
    RC.mapWithIndex((plural, entity) =>
      pipe(
        resolvers,
        // find resolvers for this entity
        A.filter((resolver) => resolver.plural === plural),
        // find the enity with the correct to value
        A.filterMap((resolver) =>
          pipe(
            normalizrEntities,
            RC.lookup(resolver.to),
            O.map((toEntity) => tuple(toEntity, resolver))
          )
        ),
        // assign mutably to the entity class.
        A.reduce(entity, (b, [toEntity, resolver]) => {
          b.define({ [resolver.from]: makeDefinableValue(resolver, toEntity) });
          return b;
        })
      )
    ),
    RC.map(tuple)
  );

  return { _S: null as any, entities: normalizrSchema };
}

function makeDefinableValue(
  resolver: Resolver<RecordData>,
  entity: NormalizrEntity
) {
  return resolver.type === "Many" ? tuple(entity) : entity;
}

export interface Schema<S> {
  _S: S;
  // normalizr relationships
  entities: NormalizrRelationships;
}
