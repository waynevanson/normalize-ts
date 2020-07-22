import { option as O, ord as ORD } from "fp-ts";
import { makeEntity } from "./entity";
import { _normalizer, normalize } from "./normalize";

describe(_normalizer, () => {
  describe("one entity, no resolvers", () => {
    type User = { id: string };
    const users = () => makeEntity<User>()({});
    const normalized = _normalizer({ users }, ORD.ordString);

    const data = Object.freeze({
      users: {
        "11": { id: "11" },
      },
    });

    test("the shape", () => {
      expect(normalized).toEqual({
        users: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
      });
    });

    test("getOption", () => {
      expect(normalized.users.getOption(data)).toEqual(O.some([{ id: "11" }]));
    });

    test("set", () => {
      expect(normalized.users.set([{ id: "22" }])(data)).toEqual({
        users: { "11": { id: "11" }, "22": { id: "22" } },
      });
    });
  });
});
