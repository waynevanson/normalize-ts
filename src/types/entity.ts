/**
 * @description
 * An entity is a struct with details about how it is represented in an ORM.
 *
 * This has an external an internal API face,
 * which is considered so once the schema has been "internalized".
 *
 * @enum domain
 * entity
 * relationship
 * resolver
 *
 *
 * @enum ORM Properties
 * cascade = true
 * primarykey = I
 *
 * single-table-inheritence? later
 * embedded entities? pre get, post get. not important yet.
 * view tables can be manually crafted.
 */

import { Lens } from "monocle-ts";
import { Lazy } from "fp-ts/lib/function";
import { RecordAny } from "./util";

// EXTERNAL - PREINTERNALIZED

/**
 * @summary
 *
 */
export type LensPrimaryKey<S extends RecordAny, A> = Lens<S, A>;

/**
 * @summary
 * An entity that represents an object in an ORM.
 * It holds relationships between many objects
 * and has a primary key field.
 *
 * @typedef T Raw data type represented by the entity.
 * @typedef I raw data type represented by the entity.
 * @typedef R raw data type represented by the entity.
 */
export type Entity<
  T,
  I extends LensPrimaryKey<T, any>,
  R extends Array<OneOrMany<Relationship<T, any>>> = Array<never>
> = {
  lensPrimaryKey: I;
  relationships: R;
};

/**
 * @summary
 * Defines a single relationship between the data `T`
 * and a property of `T` if it's an Entity.
 *
 * @property 0 The lens that link the data `T` to
 * @property 1 An entity that is in a
 */
export type Relationship<T, U> = [
  Lens<T, U>,
  OneOrMany<EntityConstructed<U, any>>
];

export type One<A> = A;
export type Many<A> = [A];
export type OneOrMany<A> = One<A> | Many<A>;

/**
 * @summary
 * Same as `Entity` but as a thunk.
 * Entities are created as thunks by the user, so this is the
 * signature we work with internally.
 */
export type EntityConstructed<
  T,
  I extends LensPrimaryKey<T, any>,
  R extends Array<OneOrMany<Relationship<T, any>>> = Array<never>
> = Lazy<Entity<T, I, R>>;

// INTERNAL - POSTINTERNALIZED

/**
 * @summary
 * An entity that represents an object in an ORM.
 *
 * The key difference between this and `Entity`
 * is that `resolvers` is the internalized version of `relationships`
 *
 */
export type EntityInternal<
  T extends Record<string, any>,
  I extends LensPrimaryKey<T, any>,
  R extends Array<Resolver<T, any, string>>
> = {
  lensPrimaryKey: I;
  resolvers: R;
};

/**
 * @summary
 * A pair of lens-string pairs in a tuple.
 *
 * @typedef T What the data resolves from.
 * @typedef U what the data resolved to.
 * @typedef K The key in `Normalized` that it refers to.
 */
export type Resolver<T, U, K extends string> = {
  lens: Lens<T, U>;
  to: K;
  type: ResolverType<U>;
};

/**
 * @summary
 * If the resolved type `U` is an array,
 * the result is `"Many"`,
 * otherwise it's `"One"`
 */
export type ResolverType<U> = U extends RecordAny[]
  ? "One"
  : U extends RecordAny
  ? "Many"
  : never;
