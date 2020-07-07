/**
 * @description
 * These types are extremely generic
 * and don't have much context on their own.
 * Instead, they can be composed and extended
 * to create contextable types.
 */

/**
 * @summary
 * A utility type to increase code resuse.
 */
export type RecordUnknown = Record<string, unknown>;

/**
 * @summary
 * Retrieve the key of an object if it's value does not equal `V`.
 */
export type KeysOfValueExclude<T extends RecordUnknown, V> = {
  [K in keyof T]: T[K] extends V ? never : K;
}[keyof T];

/**
 * @summary
 * Retrieve the key of an object if it's value equals `V`.
 */
export type KeysOfValue<T extends RecordUnknown, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
