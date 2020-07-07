/**
 * @description
 * Types for changing the shape of data
 *
 * @enum
 * Flattened
 * Flatten
 * RawBase
 * Raw
 * one as recordany, one as all the stuff I care about.
 */

import { either as E } from "fp-ts";

export type DataRaw = {};
export type Flatten<T extends DataRaw> = T;
export type Circular<T, I> = E.Either<I, T>;
