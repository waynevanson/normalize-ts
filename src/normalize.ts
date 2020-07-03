import { FunctorWithIndex1 } from "fp-ts/lib/FunctorWithIndex";
import { URIS, Kind } from "fp-ts/lib/HKT";
import { Monad1 } from "fp-ts/lib/Monad";
import { pipeable, pipe } from "fp-ts/lib/pipeable";
import { Traversable1 } from "fp-ts/lib/Traversable";
import { TraversableWithIndex1 } from "fp-ts/lib/TraversableWithIndex";
import { schemaToSchemaInternal, Schema } from "./schema";
import { record as R } from "fp-ts";
import { Lens } from "monocle-ts";
import { EntityThunk } from "./make-entity";
import { get } from "./get";
import { set } from "./set";

export type Flatten<T, S extends Schema> = T;

export type Normalize<S extends Schema, F extends "Record" | "Array"> = {
  [P in keyof S]: S[P] extends EntityThunk<infer A, any>
    ? Kind<F, Flatten<A, S>>
    : never;
};

export function normalize(schema: Schema) {
  const schemaInternal = schemaToSchemaInternal(schema);

  return <F extends URIS, I, G extends URIS>(
    // what it will be set to and get from. get(da)
    fa: TraversableWithIndex1<F, I> & FunctorWithIndex1<F, I> & Monad1<F>,
    // what it will get from and be set to. set(na)
    ga: Traversable1<G> & Monad1<G>
  ) => {
    const fap = pipeable(fa);
    const gap = pipeable(ga);

    const result = pipe(
      schemaInternal,
      R.mapWithIndex(
        (plural, ta) =>
          new Lens(
            get(plural, ta, schemaInternal),
            set(plural, ta, schemaInternal)
          )
      )
    );
  };
}
