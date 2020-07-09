/**
 * @description
 * Types for changing the shape of data
 */

import { either as E } from "fp-ts";
import { EntityConstructed, OneOrMany } from "./entity";
import { SchemaBase } from "./schema";
import { RecordUnknown } from "./util";
import { Lens } from "monocle-ts";
import { makeEntity } from "..";
import { tuple } from "fp-ts/lib/function";

// NORMALIZED - T IN DICTIONARY

/**
 * @summary
 * The value will be a string or a string[] of it's a resolvable
 *
 * @todo
 * Make a traverse type, redux has an implementation
 */
export type DataNormalized<T extends RecordUnknown, S extends SchemaBase> = {
  [P in keyof T]: T[P] extends RecordUnknown
    ? EntityConstructedFromType<T[P], S> extends any
      ? string
      : DataNormalized<T[P], S>
    : T[P] extends Array<infer U>
    ? Array<
        U extends RecordUnknown
          ? EntityConstructedFromType<U, S> extends any
            ? string
            : DataNormalized<U, S>
          : U
      >
    : T[P];
};

type User = {
  id: string;
};

type Post = {
  id: string;
  collaborators: User[];
};

const lensUser = Lens.fromProp<User>()("id");
const usersRelationships: never[] = [];
const users = () => makeEntity<User>()(lensUser, usersRelationships);

const lensPost = Lens.fromProp<Post>()("id");
const postsRelationships = [
  tuple(Lens.fromProp<Post>()("collaborators"), tuple(users)),
];
const posts = () => makeEntity<Post>()(lensPost, postsRelationships);

const schema = { users, posts };
type NN = DataNormalized<Post, typeof schema>;

// FLATTENED - T FROM PLURAL.GET

/**
 * @summary
 * A value of a resolvable property that is possibly circular
 * in relation to the root (top-level) entity.
 *
 * Returns `Left` with the index if circular,
 * otherwise returns `Right` with no changes.
 */
export type Circular<T extends RecordUnknown, I> = E.Either<I, T>;

export type DataFlattenedValueBase =
  | DataFlattenedBase
  | DataFlattenedBase[]
  | Circular<any, any>
  | Circular<any, any>[];

/**
 * @summary
 * If not `RecordAny`, the flattened data may contain any of these values,
 * possibly recursing.
 */
export type DataFlattenedBase = {
  [x: string]: DataFlattenedValueBase;
};

/**
 * @summary
 * Flattens the data into how the user will retrieve the data.
 *
 * @todo
 * More so, we need a deep check, like in redux
 * if a recordunknown|recordunknown[] has 2 of the same but
 * only one is in,then only do one. this is becuase we don't have the path: (yet)
 *
 * @todo
 * How to find the name recursively?
 *
 * @todo
 * Implement recursive directly,
 * checking if it is it's own parent
 * and returning `Circular`.
 *
 * @todo
 * Implement recurive indirectly later.
 *
 * @typedef C
 */
export type DataFlatten<
  T extends RecordUnknown,
  S extends SchemaBase,
  C = T
> = {
  // no we got the entity, we can figure out
  [P in keyof T]: EntityConstructedFromType<
    T[P] extends RecordUnknown ? T[P] : never,
    S
  > extends EntityConstructed<
    T,
    any,
    // array of relationships
    infer R
  >
    ? R extends OneOrMany<infer U>
      ? U
      : never
    : T[P];
};

// UTILITIES

/**
 * @summary
 * Retrieve the entity constructed from a schema using it's data type `T`.
 */
export type EntityConstructedFromType<
  T extends RecordUnknown,
  S extends SchemaBase
> = {
  [P in keyof S]: ReturnType<S[P]> extends EntityConstructed<T, any, any>
    ? ReturnType<S[P]>
    : never;
}[keyof S];
