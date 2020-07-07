import { array as A, option as O, record as R, tuple as TP } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { OneOrMany } from ".";
import { tuplet } from "./higher-kinded-type";
import { SchemaBase, SchemaInternal } from "./types/schema";
import { recordFindIndexUniq } from "./util";
import { Relationship } from "./types/entity";

export const convertPairToString = (schema: SchemaBase) => (
  a: OneOrMany<Relationship<any, any>>
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

export function schemaToSchemaInternal<S extends SchemaBase>(
  schema: S
): SchemaInternal<S> {
  return pipe(
    schema,
    R.map((entityThunk) => {
      const { id, relationships } = entityThunk();
      const resolvers = pipe(
        entity.relationships,
        A.map(convertPairToString(schema)),
        A.compact
      );
      const result = { id, resolvers };
      return result;
    })
  );
}
