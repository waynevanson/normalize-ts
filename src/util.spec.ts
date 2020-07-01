import { recordFindIndexUniq } from "./util";
import { pipe } from "fp-ts/lib/pipeable";
import { option as O } from "fp-ts";

describe(recordFindIndexUniq, () => {
  test("Returns None when no index can be found", () => {
    const predicate = (a: number) => a === 5;
    const input = { zero: 0, one: 1, two: 2, three: 3, four: 4 };
    const result = pipe(input, recordFindIndexUniq(predicate));
    const expected = O.none;
    expect(result).toMatchObject(expected);
  });

  test("Returns Some when an index can be found", () => {
    const predicate = (a: number) => a === 2;
    const input = { zero: 0, one: 1, two: 2, three: 3, four: 4 };
    const result = pipe(input, recordFindIndexUniq(predicate));
    const expected = O.some("two");
    expect(result).toMatchObject(expected);
  });

  test("Returns None when more than one index can be found", () => {
    const predicate = (a: number) => a >= 3;
    const input = { zero: 0, one: 1, two: 2, three: 3, four: 4 };
    const result = pipe(input, recordFindIndexUniq(predicate));
    const expected = O.none;
    expect(result).toMatchObject(expected);
  });
});
