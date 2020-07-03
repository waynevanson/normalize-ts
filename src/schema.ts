import {
  array as A,
  map as M,
  record as R,
  tuple as TP,
  option as O,
} from "fp-ts";
import { pipe, tuple, flow } from "fp-ts/lib/function";
import { Lens } from "monocle-ts";
import { EntityThunk, makeEntity, OneOrMany, Pair } from "./make-entity";
import { KeysOfValue, recordFindIndexUniq } from "./util";
import { tuplet } from "./higher-kinded-type";

export type Schema = Record<string, EntityThunk<any, any>>;

/**
 * @summary
 * The result of turning keys into
 */
export type SchemaInternal<S extends Schema> = {
  [P in keyof S]: ReturnType<S[P]> extends Array<
    OneOrMany<[infer L, OneOrMany<infer A>]>
  >
    ? Array<
        unknown extends A
          ? never
          : L extends any
          ? [L, KeysOfValue<S, A>]
          : never
      >
    : never;
};

type SchemaInternalBase = Record<string, [Lens<any, any>, string][]>;

const convertPairToString = (schema: Schema) => (
  a: OneOrMany<Pair<any, any>>
) =>
  pipe(
    tuplet.enforceNotTuplet(a),
    TP.mapLeft(tuplet.enforceNotTuplet),
    TP.mapLeft((b) =>
      pipe(
        schema,
        recordFindIndexUniq((c) => c === b)
      )
    ),
    TP.swap,
    TP.sequence(O.option),
    O.map(TP.swap)
  );

export function schemaToSchemaInternal(schema: Schema): SchemaInternalBase {
  return pipe(
    schema,
    R.map((entityThunk) =>
      pipe(entityThunk(), A.map(convertPairToString(schema)), A.compact)
    )
  );
}
