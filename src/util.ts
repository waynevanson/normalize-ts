import { option as O, array as A } from "fp-ts";
import { Predicate, Refinement, flow } from "fp-ts/lib/function";

export const recordFindIndexUniq = <A, B extends A>(
  f: Predicate<A> | Refinement<A, B>
) => (fa: Record<string, A>): O.Option<string> => {
  let r: string[] = [];

  for (const key in fa) {
    const value = fa[key];
    if (f(value)) r.push(key);
  }

  if (r.length === 1) return O.some(r[0]);
  else return O.none;
};

export const isNumber = (a: unknown): a is number =>
  typeof a === "number" && !Number.isNaN(a);

export const oNumber = O.fromPredicate(isNumber);

// refinement ts would be great rn
export const isArray = <A>(a: A): a is Extract<A, Array<any>> =>
  Array.isArray(a);

export const oNumberArray = flow(
  O.fromPredicate(isArray),
  O.chain(flow(A.map(oNumber), A.sequence(O.option)))
);
