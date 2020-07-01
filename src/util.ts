import { option as O } from "fp-ts";
import { Predicate, Refinement } from "fp-ts/lib/function";

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
