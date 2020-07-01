import {
  array as A,
  either as E,
  monoid,
  option as O,
  record as R,
  tuple as TP,
} from "fp-ts";
import { tuple } from "fp-ts/lib/function";
import { pipe } from "fp-ts/lib/pipeable";
import { Optional } from "monocle-ts";
import { Entity, ID } from "./create-entity";
import { tuplet } from "./higher-kinded-type";
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

const through = <T>(f: (a: T) => any = (a) => a) => (a: T) => {
  console.dir(f(a));
  return a;
};

const enforceArray = <T>(a: T | T[]): T[] => (Array.isArray(a) ? a : [a]);

const schemaToSchematics = (schema: SchemaBase): Schematic[] =>
  pipe(
    schema,
    R.foldMapWithIndex(A.getMonoid<O.Option<Schematic>>())((plural, entity) =>
      pipe(
        entity.resolvers(),
        R.toArray,
        A.map(TP.mapLeft(tuplet.enforceNotTuplet)),
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

  // from plural: users, from: group, to:groups
  const getSchematic = (plural: string, from: string) => {
    const result = pipe(
      schematics,
      A.findFirst((a) => a.plural === plural && a.from === from)
    );
    return result;
  };

  const getRecursion = (
    plural: string,
    flat: Flattened<any, any>,
    normalized: Record<string, Record<string, Flattened<T, any>>>
  ): O.Option<Recursive> => {
    // console.dir({ flat, schematics });
    return pipe(
      flat,
      R.mapWithIndex((from, value) =>
        pipe(
          getSchematic(plural, from),
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
                    O.chain((a) => getRecursion(to, a, normalized))
                  )
                )
              ),
              E.mapLeft((id) =>
                pipe(
                  R.lookup(to, normalized),
                  O.chain((flats) => pipe(R.lookup(id, flats))),
                  O.chain((a) => getRecursion(to, a, normalized))
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
  };

  // overwrite with the latest
  const monoidNormalized = R.getMonoid(
    R.getMonoid<string, Flattened<T, any>>({ concat: (x, y) => y })
  );

  const toNormalized = (plural: string, flattened: any) =>
    R.singleton(plural, R.singleton(flattened.id, flattened)) as Record<
      string,
      Record<string, Flattened<T, any>>
    >;

  const setRecursion = (
    plural: string,
    nested: Recursive
  ): Record<string, Record<string, Flattened<T, any>>> => {
    // dictionary is not the nested!
    const demo = pipe(
      nested,
      // fuck
      R.mapWithIndex((from, v: any) =>
        pipe(
          getSchematic(plural, from),
          // can flatten, can recurse
          O.map(({ to }) => {
            console.dir({ to });
            return pipe(
              // enforce as array for folding.
              v as Recursive | Recursive[],
              O.fromPredicate((a): a is Recursive[] => Array.isArray(a)),
              O.getOrElse(() => [v] as Recursive[]),
              // do the recursive thing
              A.foldMap(monoidNormalized)((a) => {
                // why is this not on?
                const result = setRecursion(to, a);
                // console.dir({ aaaaa: a, result });
                return result;
              })
            );
          }),
          O.fold(
            () => tuple(v, monoidNormalized.empty),
            (n) =>
              tuple(
                Array.isArray(v)
                  ? pipe(
                      v,
                      A.map((a) => a.id)
                    )
                  : v.id,
                n
              )
          )
        )
      ),
      R.reduceWithIndex(
        tuple(
          {} as any,
          [] as Record<string, Record<string, Flattened<T, any>>>[]
        ),
        (k, [bv, bn], [av, an]) => {
          // console.dir({ k, bv, bn, av, an, plural });
          return tuple(pipe(bv, R.insertAt(k, av)), A.snoc(bn, an));
        }
      ),
      ([flattened, ns]) => {
        const n = toNormalized(plural, flattened);
        const result = A.snoc(ns, n);
        // console.log({ flattened, ns, n });
        return result;
      },
      A.foldMap(monoidNormalized)((a) => {
        return a;
      })
    );

    return demo;
  };

  return new Optional<
    Record<string, Record<string, Flattened<T, any>>>,
    Record<string, T>
  >(
    (normalized) =>
      pipe(
        R.lookup(plural, normalized),
        O.map(
          R.map((flat) => {
            const result = getRecursion(plural, flat, normalized) as O.Option<
              T
            >;
            return result;
          })
        ),
        O.chain(R.sequence(O.option))
      ),
    // flatten the nested into the normalized state, then merge normalized states
    // overwrite old with new.
    (dictionary) => (normalized) => {
      const result = pipe(
        dictionary,
        R.foldMap(monoidNormalized)((nested) => setRecursion(plural, nested))
      );
      return monoid.fold(monoidNormalized)([normalized, result]);
    }
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
