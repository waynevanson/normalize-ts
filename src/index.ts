// makeEntity
// single deep values for inference
//
// convert the function to a string.

import { pipe, tuple } from "fp-ts/lib/function";
import {
  record as R,
  array as A,
  option as O,
  either as E,
  eq as EQ,
} from "fp-ts";
import { tuplet, eitherV as EV } from "./higher-kinded-type";
import { enforceNotTuplet } from "./higher-kinded-type/tuplet";

export type RecordUnknown = Record<string, unknown>;
export type RecordID = Record<"id", string>;
export type RecordData = RecordID & RecordUnknown;

type EnitableKeys<T extends RecordData> = {
  [P in keyof T]: T[P] extends RecordData | RecordData[] ? P : never;
}[keyof T];

export type RelationshipMap<A extends RecordData> = Partial<
  Omit<
    Pick<
      {
        [P in keyof A]: A[P] extends Array<infer U>
          ? U extends RecordData
            ? [() => Entity<U, any>]
            : never
          : A[P] extends RecordData
          ? () => Entity<A[P], any>
          : never;
      },
      EnitableKeys<A>
    >,
    "id"
  >
>;

export interface LazyEntity {
  (): Entity<any, Relationships>;
}

export type RelationshipValue = LazyEntity | [LazyEntity];

export type Relationships = Record<string, RelationshipValue | undefined>;

export interface Entity<A extends RecordData, R extends Relationships> {
  readonly _tag: "Entity";
  readonly _A: A;
  relationships: R;
}

export function makeEntity<A extends RecordData>() {
  return <R extends RelationshipMap<A>>(
    relationships = {} as R
  ): Entity<A, R> => ({
    _tag: "Entity",
    _A: null as any,
    relationships,
  });
}

export type Schema = Record<string, LazyEntity>;

export type ResolverType = "One" | "Many";
export interface Resolver {
  from: string;
  to: string;
  type: ResolverType;
}

const mevaResolver = EV.getMonoid(A.getMonoid<Resolver>());

const makeOneOrMany = (a: RelationshipValue) =>
  Array.isArray(a) ? "Many" : "One";

export function makeResolversFromSchema(schema: Schema) {
  const schemaArray = pipe(schema, R.toArray);
  return pipe(
    schemaArray,
    A.foldMap(mevaResolver)(([plural, lazyEntity]) =>
      pipe(
        lazyEntity().relationships,
        R.filterMap(O.fromNullable),
        R.foldMapWithIndex(mevaResolver)((from, oneOrManyLazyEntity) =>
          pipe(oneOrManyLazyEntity, enforceNotTuplet, (lazyEntity) =>
            pipe(
              schemaArray,
              A.findFirst(([, a]) => a === lazyEntity),
              O.map(([to]) => to),
              EV.fromOption(() => [
                `Can't find the to value "${plural} -> ${from}"`,
              ]),
              EV.map((to): Resolver[] => [
                { from, to, type: makeOneOrMany(oneOrManyLazyEntity) },
              ])
            )
          )
        )
      )
    )
  );
}

// tests
type User = {
  id: string;
  posts: Post[];
};

type Post = {
  id: string;
  author: User;
};

const users = () => makeEntity<User>()({ posts: [posts] });

const posts = () => makeEntity<Post>()({ author: users });

const schema = { users, posts };
const resolvers = makeResolversFromSchema(schema);
