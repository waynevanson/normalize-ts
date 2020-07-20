import {
  array as A,
  either as E,
  monoid,
  option as O,
  reader as R,
  record as RC,
  tuple as TP,
  record,
} from "fp-ts";
import { sequenceS } from "fp-ts/lib/Apply";
import { tailRec } from "fp-ts/lib/ChainRec";
import { flow, pipe, tuple } from "fp-ts/lib/function";
import { RecordData, PrimitiveValue, RecordID } from "./entity";
import { retrieveResolver } from "./get-option";
import { Normalized, NormalizeDeps } from "./normalize";
import { Resolver } from "./schema";
import { Index } from "monocle-ts";

/**
 * @summary
 * The value in this type has been referenced elsewhere.
 *
 * @todo
 * The type above this is the one or many type.
 */
export interface Indexed<A = any> {
  /**
   * @summary
   * A phantom type to keep track of the type when composing types.
   */
  _A: A;

  /**
   * @summary
   * The general name of this struct.
   */
  _tag: "Indexed";

  /**
   * @summary
   * This value could possibly reference itself, and should return a `Circular` type.
   *
   * @todo Implement
   */
  circular: boolean;

  /**
   * @summary
   * The unique ID within the normalized state's dictionary.
   */
  id: string;

  /**
   * @summary
   * The index in the normalized state's dictionary this value is held at.
   */
  index: number;

  /**
   * @summary
   * The index in the normalized stat the dictionary is held at.
   */
  plural: string;
}

export function makeIndexed(
  params: Pick<Indexed, "circular" | "index" | "plural">
): Indexed {
  const defaults = { _tag: "Indexed" } as Omit<
    Indexed,
    "circular" | "index" | "plural"
  >;

  return Object.assign({}, defaults, params);
}

const mNormalized: monoid.Monoid<Normalized> = RC.getMonoid(A.getMonoid());

export function isRecordDataOne(a: unknown): a is RecordData {
  return a instanceof Object && RC.hasOwnProperty("id", a);
}

export function isRecordDataMany(a: unknown): a is Array<RecordData> {
  return Array.isArray(a) && a.every(isRecordDataOne);
}

export function isRecordDataOneOrMany(
  a: unknown
): a is Array<RecordData> | RecordData {
  return isRecordDataMany(a) || isRecordDataOne(a);
}

export function enforceArray<T>(a: T | Array<T>): Array<T> {
  return Array.isArray(a) ? a : [a];
}

interface Arg {
  /**
   * @summary
   * The name of the dictionary.
   */
  plural: string;

  /**
   * @summary
   * An `Array` of `RecordData` that can be enforced.
   *
   * @todo
   * Handle circular style references from plural.
   */
  nests: Array<RecordData>;
}

interface Return {
  /**
   * @summary
   * The resolver for this value, from the perspective of it's parent.
   */
  resolver: Resolver;

  /**
   * @summary
   * The value of a `RecordData` that is resolvable and enforced into an `Array`.
   * These can be flattened.
   */
  values: Array<RecordData>;
}

/**
 * @summary
 * Collect the data on index `1`, with index `0` doing all the work.
 */
export type Recurse = [Array<Arg>, Array<Return>];

export function continueRecursion(
  recurse: Recurse
): E.Either<Recurse, Array<Return>> {
  return pipe(
    recurse,
    E.fromPredicate(
      (r): r is [[], Array<Return>] => TP.fst(r).length === 0,
      (a) => a
    ),
    E.swap,
    E.map(TP.snd)
  );
}

export function doubleRecurseMerge([a, b]: [
  Array<Return>,
  Array<Return>
]): Recurse {
  const returns = A.getMonoid<Return>().concat(a, b);
  const args = pipe(
    a,
    A.map((x): Arg => ({ plural: x.resolver.to, nests: x.values }))
  );
  return tuple(args, returns);
}

export function argToResolvers({ plural, nests }: Arg) {
  return (resolvers: Resolver[]) =>
    pipe(
      nests,
      A.map(
        RC.filterMapWithIndex((from, value) =>
          sequenceS(O.option)({
            resolver: pipe(resolvers, retrieveResolver(plural, from)),
            values: pipe(
              value,
              O.fromPredicate(isRecordDataOneOrMany),
              O.map(enforceArray)
            ),
          })
        )
      ),
      A.chain(RC.collect((k, v): Return => v))
    );
}

export function chainRecRecurse(recurse: Recurse) {
  return pipe(
    recurse,
    TP.map((args) =>
      pipe(args, A.map(argToResolvers), A.sequence(R.reader), R.map(A.flatten))
    ),
    TP.sequence(R.reader),
    R.map(flow(doubleRecurseMerge, continueRecursion))
  );
}

/**
 * @summary
 * A type that is not yet index, but could be.
 */
export interface Indexable extends Pick<Indexed, "id" | "plural"> {
  _tag: "Indexable";
}

export function makeIndexable(params: Omit<Indexable, "_tag">): Indexable {
  return Object.assign(
    {},
    { _tag: "Indexable" } as Pick<Indexable, "_tag">,
    params
  );
}

export function isRecord(a: unknown): a is Record<string, unknown> {
  return a instanceof Object && a.constructor.name === "Object";
}

export function isIndexable(a: unknown): a is Indexable {
  return isRecord(a) && RC.hasOwnProperty("_tag", a);
}

export function eSplitArray<T>(a: T) {
  return pipe(
    a,
    E.fromPredicate(
      (a): a is Extract<T, Array<any>> => Array.isArray(a),
      (e) => e as Exclude<T, Array<any>>
    )
  );
}

export function isIndexabled(a: unknown): a is Indexable | Array<Indexable> {
  return (Array.isArray(a) && a.every(isIndexable)) || isIndexable(a);
}

export function isRecordIDandThatBoi(
  a: unknown
): a is RecordID & Record<string, ThatBoi> {}

/**
 * @summary
 *
 * @todo use the `type` property from resolver
 */
export function makeSomeIndexable({
  values,
  resolver: { from, to },
}: Return): Array<RecordID & Record<string, ThatBoi>> {
  const ass = (recordData: RecordData) =>
    makeIndexable({ id: recordData.id, plural: to });

  return pipe(
    values,
    A.map(
      flow(
        RC.mapWithIndex((froma, value) =>
          pipe(
            value,
            O.fromPredicate(() => froma === from),
            O.chain(O.fromPredicate(isRecordDataOneOrMany)),
            O.map(flow(eSplitArray, E.map(A.map(ass)), E.getOrElseW(ass))),
            O.getOrElseW(() => value as PrimitiveValue | Array<PrimitiveValue>)
          )
        )
      )
    ),
    A.filter(isRecordIDandThatBoi)
  );
}

type ThatBoi =
  | Array<Indexable>
  | Indexable
  | Array<PrimitiveValue>
  | PrimitiveValue;

type ThisBoi =
  | Array<Indexed>
  | Indexed
  | Array<PrimitiveValue>
  | PrimitiveValue;

function findIndex(
  ax: Record<string, Array<RecordID & Record<string, ThatBoi>>>,
  indexable: Indexable
): O.Option<number> {
  return pipe(
    RC.lookup(indexable.plural, ax),
    O.chain(A.findIndex((a) => a.id === indexable.id))
  );
}

function useMakeIndex(
  thatbois: Record<string, Array<RecordID & Record<string, ThatBoi>>>
) {
  return (indexable: Indexable) =>
    pipe(
      findIndex(thatbois, indexable),
      O.map((index) =>
        makeIndexed({
          index,
          circular: false,
          plural: indexable.plural,
        })
      )
    );
}

const mraRecordIDRecordThatBoi = RC.getMonoid(
  A.getMonoid<RecordID & Record<string, ThatBoi>>()
);

const returnToThatBois = A.foldMap(mraRecordIDRecordThatBoi)((rr: Return) =>
  pipe(
    makeSomeIndexable(rr),
    A.foldMap(mraRecordIDRecordThatBoi)((recordData) =>
      RC.singleton(rr.resolver.plural, [recordData])
    )
  )
);

const result = (recurse: Recurse) =>
  pipe(
    R.ask<Resolver[]>(),
    R.map((resolvers) => tailRec(recurse, (a) => chainRecRecurse(a)(resolvers)))
  );

/**
 * @summary
 * Tail recurse the folded.
 */
export function setMain(plural: string, nests: Array<RecordData>) {
  const recurse: Recurse = [[{ plural, nests }], []];

  const result2 = pipe(
    R.asks((deps: NormalizeDeps) => deps.resolvers),
    R.map(flow(result(recurse), returnToThatBois)),
    R.map((thatbois) =>
      pipe(
        thatbois,
        RC.map(
          A.map(
            flow(
              E.fromPredicate(
                isIndexabled,
                (e) => e as Array<PrimitiveValue> | PrimitiveValue
              ),
              E.map(
                flow(
                  eSplitArray,
                  E.map(A.map(useMakeIndex(thatbois))),
                  E.map(A.sequence(O.option)),
                  E.getOrElseW(useMakeIndex(thatbois))
                )
              ),
              E.getOrElse((a): O.Option<ThisBoi> => O.some(a))
            )
          )
        ),
        RC.map(A.compact)
      )
    )
  );

  return result2;
}
