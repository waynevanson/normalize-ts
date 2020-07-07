import {
  array as A,
  either as E,
  option as O,
  record as R,
  these as T,
} from "fp-ts";
import { sequenceS } from "fp-ts/lib/Apply";
import { flow, pipe } from "fp-ts/lib/function";
import { HKT, Kind, URIS } from "fp-ts/lib/HKT";
import { Monad1 } from "fp-ts/lib/Monad";
import {
  pipeable,
  PipeableChain1,
  PipeableFoldableWithIndex1,
  PipeableFunctorWithIndex1,
} from "fp-ts/lib/pipeable";
import { TraversableWithIndex1 } from "fp-ts/lib/TraversableWithIndex";
import { Lens, Optional } from "monocle-ts";
import { EntityConstructed, OneOrMany } from "../make-entity";
import {
  Circular,
  EntityInternal,
  PairInternal,
  SchemaBase,
  SchemaInternal,
  SchemaInternalBase,
  schemaToSchemaInternal,
} from "../schema";
import { theseV } from "../higher-kinded-type";
// could do helper functions like
// is circular,
// is not circular
//

export type EntityFromType<T, S extends SchemaBase> = {
  [P in keyof S]: ReturnType<S[P]> extends {
    relationships: Array<OneOrMany<[T, any]>>;
  }
    ? ReturnType<S[P]>
    : never;
}[keyof S];

export type FlattenBase = {
  [x: string]:
    | FlattenBase
    | FlattenBase[]
    | Circular<any, any>
    | Circular<any, any>[]
    | any;
};

/**
 * @summary
 *
 * This is handy for the user but not the
 * library owner.
 * The library owner will need a static type.
 *
 * @todo
 * How to find the name recursively?
 *
 * @todo
 * Implement recursive directly,
 * checking if it is it's own parent
 * and returning `Circular`.
 *
 * @todo
 * Implement recurive indirectly later.
 */
export type Flatten<T, S extends SchemaBase> = {
  [P in keyof T]: EntityFromType<T[P], S> extends infer U ? U : T[P];
};

export type NormalizeBase<F extends URIS> = Record<
  string,
  Kind<F, FlattenBase>
>;

/**
 * The type that is associated with the dictionary.
 * It holds all the values for the given type.
 */
export type Normalize<S extends SchemaBase, F extends URIS> = {
  [P in keyof S]: S[P] extends EntityConstructed<infer A, any, any>
    ? Kind<F, Flatten<A, S>>
    : never;
};

/**
 *
 * @param fa A higher-kinded-type used to hold many items of type `T`
 * @param transform A lens to transform the input to the output.
 *
 * @todo
 * The default lens for transform. Just an identity
 *
 * @todo
 * NormalizeResult type def.
 */
export function normalize<F extends URIS, I, G>(
  fa: TraversableWithIndex1<F, I> & Monad1<F>,
  transform: <T extends Record<string, any>>(
    lens: Lens<T, unknown>
  ) => Lens<Kind<F, T>, HKT<G, T>>
) {
  const fap = pipeable(fa);

  return <S extends SchemaBase>(schema: S) => {
    const schemaInternal = schemaToSchemaInternal(schema);

    const result = pipe(
      schemaInternal as SchemaInternalBase,
      R.mapWithIndex((plural, { id }) => {
        return new Lens(
          (normalized: Normalize<S, F>) =>
            pipe(
              getRecursive(fa, fap, schemaInternal, normalized, plural),
              T.fold(
                (e) => {
                  console.error(e);
                  return transform(id).get(fa.of({}));
                },
                transform(id).get,
                (e, a) => {
                  console.error(e);
                  return transform(id).get(a);
                }
              )
            ),
          (a) => (s) => s
        );
      })
    );
    return result;
  };
}

type OptionalDictionary<
  F extends URIS,
  S extends SchemaBase,
  T extends Record<string, any>
> = Optional<Normalize<S, F>, Dictionary<F, S, T>>;

type Dictionary<
  F extends URIS,
  S extends SchemaBase,
  T extends Record<string, any>
> = Kind<F, Flatten<T, S>>;

const optionalNormalizedToDictionary = <
  F extends URIS,
  S extends SchemaBase,
  T extends Record<string, any>
>(
  plural: string
) => Optional.fromNullableProp<any>()(plural) as OptionalDictionary<F, S, T>;

const getRecursive = <
  F extends URIS,
  I,
  S extends SchemaBase,
  T extends Record<string, any>
>(
  fa: TraversableWithIndex1<F, I> & Monad1<F>,
  fap: PipeableChain1<F> &
    PipeableFunctorWithIndex1<F, I> &
    PipeableFoldableWithIndex1<F, I>,
  schemaInternal: SchemaInternal<S>,
  normalized: Normalize<S, F>,
  plural: string
): theseV.TheseV<Kind<F, T>> => {
  const tEntityInternal = pipe(
    R.lookup(plural, schemaInternal as SchemaInternalBase) as O.Option<
      EntityInternal<T, I, PairInternal<T, I | I[], string>[]>
    >,
    theseV.fromOption(() => [
      {
        message: `Could not find plural "${plural}" inside schemaInternal`,
        data: { plural, schemaInternal },
      },
    ])
  );

  const tDictionary = pipe(
    optionalNormalizedToDictionary<F, S, T>(plural).getOption(normalized),
    theseV.fromOption(() => [
      {
        message: `Could not find plural "${plural}" inside normalized `,
        data: { plural, normalized },
      },
    ])
  );

  // look up the index in the next dictionary
  const repeatable = (plural: string, index: I) =>
    getRecursive(fa, fap, schemaInternal, normalized, plural);

  return pipe(
    sequenceS(theseV.theseV)({
      dictionary: tDictionary,
      entityInternal: tEntityInternal,
    }),
    theseV.chain(({ dictionary, entityInternal: { id, resolvers } }) =>
      pipe(
        dictionary,
        fap.map((flattened) =>
          pipe(
            resolvers,
            A.reduce(theseV.theseV.of(flattened as T), (b, [lens, to]) =>
              pipe(
                b,
                theseV.chain((flatnested) =>
                  pipe(
                    flatnested,
                    lens.asOptional().getOption,
                    theseV.fromOption(() => [
                      {
                        message: `Could not find resolvable value from lense`,
                        data: { b, lens, to },
                      },
                    ]),
                    theseV.chain((indexorindicies) =>
                      pipe(
                        indexorindicies,
                        E.fromPredicate(
                          (a): a is I[] => Array.isArray(a),
                          (a) => a as I
                        ),
                        E.fold(
                          (index) =>
                            repeatable(to, index) as theseV.TheseV<any>,
                          flow(
                            A.map((index) => repeatable(to, index)),
                            A.sequence(theseV.theseV)
                          )
                        )
                      )
                    ),
                    theseV.map((newValue) => lens.set(newValue as any) as any)
                  )
                )
              )
            )
          )
        ),
        fa.sequence(theseV.theseV)
      )
    )
  );
};
