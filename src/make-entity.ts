import { Lazy } from "fp-ts/lib/function";
import { Lens } from "monocle-ts";

/**
 * @summary
 * Create an Entity
 */
export type Entity<T, L extends Pair<T, any> = never> = Array<OneOrMany<L>>;

/**
 * @summary
 * Same as `Entity<T,L>` but as a thunk.
 */
export type EntityThunk<T, L extends Pair<T, any> = never> = Lazy<Entity<T, L>>;

/**
 * @summary
 * A pair that maps the result of a lens to an entity.
 */
export type Pair<T, U> = [Lens<T, U>, OneOrMany<EntityThunk<U, any>>];

export type One<A> = A;
export type Many<A> = [A];
export type OneOrMany<A> = One<A> | Many<A>;

/**
 * @summary
 * Make a new entity.
 * Return call this function from a thunk because
 * circular references don't work otherwise.
 *
 * @param relationships
 * @see Pair
 * An array of `Pair`, which maps a lens to an entity.
 *
 * @example
 * const users = () => makeEntity<User>()()
 */
export function makeEntity<T>() {
  return <L extends Pair<T, any> = never>(
    relationships: Array<OneOrMany<L>>
  ): Entity<T, L> => relationships;
}
