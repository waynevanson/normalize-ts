import { LensPrimaryKey, Relationship, Entity } from "./types/entity";
import { RecordUnknown } from "./types/util";

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
export function makeEntity<T extends RecordUnknown>() {
  return <
    I extends LensPrimaryKey<T, any>,
    R extends Array<Relationship<T, any>>
  >(
    lensPrimaryKey: I,
    relationships: R
  ): Entity<T, I, R> => ({ lensPrimaryKey, relationships });
}
