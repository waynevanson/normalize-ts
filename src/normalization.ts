import { record as R, option as O, array as A, either as E } from "fp-ts";
import { pipe } from "fp-ts/lib/pipeable";
import { Optional, Lens } from "monocle-ts";
import { Entity, ID } from "./create-entity";
import { recordFindIndexUniq } from "./util";

// flatten

type SchemaBase = Record<string, Entity<any, any>>;

// if T is in S somewhere, turn anything with a resolver into a string|string[]
type EntityFromSchema<T extends ID, S extends SchemaBase> = S[{
  [P in keyof S]: S[P]["_A"] extends T ? P : never;
}[keyof S]];

// flatten
export type Flattened<T extends ID, S extends SchemaBase> = {
  [P in keyof T]: EntityFromSchema<T, S> extends Entity<any, infer K>
    ? P extends K
      ? T[P] extends any[]
        ? string[]
        : string
      : T[P]
    : never;
};

// the model, the state of normalized
type Normalized<S extends SchemaBase> = {
  [P in keyof S]: S[P] extends Entity<infer A, any>
    ? Record<string, Flattened<A, S>>
    : never;
};

//the result of normalization
type NormalizationResult<S extends SchemaBase> = {
  [P in keyof S]: S[P] extends Entity<infer A, any>
    ? Optional<Normalized<S>, Record<string, A>>
    : never;
};

type Schematic = { from: string; to: string; plural: string };

const schemaToSchematics = (schema: SchemaBase): Schematic[] =>
  pipe(
    schema,
    R.foldMapWithIndex(A.getMonoid<O.Option<Schematic>>())((plural, entity) =>
      pipe(
        entity.resolvers(),
        R.toArray,
        A.map(([from, et]: [string, Entity<any, any>]) =>
          pipe(
            schema,
            recordFindIndexUniq((a) => a === et),
            O.map((to) => ({ to, from, plural }))
          )
        )
      )
    ),
    A.compact
  );

const makeOptional = <T extends ID>(
  plural: string,
  schematics: Schematic[]
) => {
  interface Recursive {
    [x: string]: any | Recursive | Recursive[];
  }

  const recurse = (
    flat: Flattened<any, any>,
    normalized: Record<string, Record<string, Flattened<T, any>>>
  ): O.Option<Recursive> =>
    pipe(
      flat,
      R.mapWithIndex((from, value) =>
        pipe(
          schematics,
          A.findFirst((a) => a.from === from && a.plural === plural),
          O.map(({ to }) =>
            pipe(
              value,
              E.fromPredicate(
                (a): a is string[] => Array.isArray(a),
                (a) => a as string
              ),
              E.map(
                A.map((id) =>
                  pipe(
                    R.lookup(to, normalized),
                    O.chain((flats) => pipe(R.lookup(id, flats))),
                    O.chain((a) => recurse(a, normalized))
                  )
                )
              ),
              E.mapLeft((id) =>
                pipe(
                  R.lookup(to, normalized),
                  O.chain((flats) => pipe(R.lookup(id, flats))),
                  O.chain((a) => recurse(a, normalized))
                )
              ),
              E.fold(
                (a) => a as O.Option<Recursive> | O.Option<Recursive[]>,
                (aoFlat) => pipe(aoFlat, A.sequence(O.option))
              )
            )
          ),
          O.fold(
            () => O.some(value) as O.Option<Recursive> | O.Option<Recursive[]>,
            (a) => a
          )
        )
      ),
      R.sequence(O.option)
    );

  return new Optional<
    Record<string, Record<string, Flattened<T, any>>>,
    Record<string, T>
  >(
    (normalized) =>
      pipe(
        R.lookup(plural, normalized),
        O.map(
          R.map((flat) => {
            const result = recurse(flat, normalized) as O.Option<T>;
            console.log(result);
            return result;
          })
        ),
        O.chain(R.sequence(O.option))
      ),
    (a) => (normalized) => normalized
  );
};

// gets the schema and turtns it into all the lenses and stuff.
export function normalization<S extends SchemaBase>(
  schema: S
): NormalizationResult<S> {
  const schematics = schemaToSchematics(schema);

  const result = pipe(
    schema,
    R.mapWithIndex((plural) => makeOptional(plural, schematics))
  );
  return (result as unknown) as NormalizationResult<S>;
}
