import { either as E, option as O } from "fp-ts";
import { Optional } from "monocle-ts";
import { makeEntity } from "./entity";
import { normalize } from "./normalize";
import { pipe } from "fp-ts/lib/function";

describe(normalize, () => {
  describe("basic", () => {
    test("basic", () => {
      type User = {
        id: string;
      };

      const users = () => makeEntity<User>()();
      const schema = { users };
      const normalized = normalize(schema);

      expect(normalized).toStrictEqual(
        E.right({ users: expect.any(Optional) })
      );

      // get
      expect(
        pipe(
          normalized,
          E.map((a) => a.users.getOption({ users: [{ id: "2" }] }))
        )
      ).toStrictEqual(E.right(O.some([{ id: "2" }])));

      // set
      expect(
        pipe(
          normalized,
          E.map((a) => a.users.set([{ id: "2" }])({ users: [] }))
        )
      ).toStrictEqual(E.right({ users: [{ id: "2" }] }));
    });
  });
});
