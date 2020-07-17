import { array as A, option as O, record as RC } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { LazyEntity, RelationshipValue } from "./entity";
import { eitherV as EV } from "./higher-kinded-type";
import { enforceNotTuplet } from "./higher-kinded-type/tuplet";
import { errorTo } from "./errors";

export type Schema = Record<string, LazyEntity>;

export type Resolver = ResolverOne | ResolverMany;

export interface ResolverOne {
  plural: string;
  from: string;
  to: string;
  type: "One";
}

export interface ResolverMany {
  plural: string;
  from: string;
  to: string;
  type: "Many";
}

export const makeOneOrMany = (a: RelationshipValue) =>
  Array.isArray(a) ? "Many" : "One";

export const getTo = (lazyEntity: LazyEntity) =>
  flow(
    A.findFirst(([, a]: [string, LazyEntity]) => Object.is(a, lazyEntity)),
    O.map(([to]) => to)
  );

export const mevaResolver = EV.getMonoid(A.getMonoid<Resolver>());

export function makeResolversFromSchema(schema: Schema) {
  const schemaArray = pipe(schema, RC.toArray);

  return pipe(
    schemaArray,
    A.foldMap(mevaResolver)(([plural, lazyEntity]) =>
      pipe(
        lazyEntity().relationships,
        RC.filterMap(O.fromNullable),
        RC.foldMapWithIndex(mevaResolver)((from, oneOrManyLazyEntity) =>
          pipe(oneOrManyLazyEntity, enforceNotTuplet, (lazyEntity) =>
            pipe(
              schemaArray,
              getTo(lazyEntity),
              EV.fromOption(() => errorTo(plural, from)),
              EV.map((to): Resolver[] => [
                { plural, from, to, type: makeOneOrMany(oneOrManyLazyEntity) },
              ])
            )
          )
        )
      )
    )
  );
}
