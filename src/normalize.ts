import { record as R } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { HKT, Kind, URIS } from "fp-ts/lib/HKT";
import { Monad1 } from "fp-ts/lib/Monad";
import { pipeable } from "fp-ts/lib/pipeable";
import { TraversableWithIndex1 } from "fp-ts/lib/TraversableWithIndex";
import { Lens } from "monocle-ts";
import { schemaToSchemaInternal } from "./schema";
import { SchemaBase } from "./types/schema";

/**
 *
 * @param fa A higher-kinded-type used to hold many items of type `T`
 * @param transform A lens to transform the input to the output.
 *
 * @todo
 * The default lens for transform. Just an identity
 *
 */
export function normalize<F extends URIS, I, G = F>(
  fa: TraversableWithIndex1<F, I> & Monad1<F>,
  transform: <T extends Record<string, any>>(
    lens: Lens<T, unknown>
  ) => Lens<Kind<F, T>, HKT<G, T>>
) {
  const fap = pipeable(fa);

  return <S extends SchemaBase>(schema: S) => {
    const schemaInternal = schemaToSchemaInternal(schema);

    const result = pipe(
      //@ts-expect-error
      schemaInternal,
      R.mapWithIndex((plural, entity) => {})
    );
    return result;
  };
}
