import { either as E, option as O } from "fp-ts";
import { Optional } from "monocle-ts";
import { makeEntity } from "./entity";
import { normalize } from "./normalize";
import { pipe } from "fp-ts/lib/function";

describe(normalize, () => {
  describe("One entity, no relationships", () => {
    type User = {
      id: string;
    };

    const users = () => makeEntity<User>()();
    const schema = { users };
    const normalized = normalize(schema);

    test("Normalized object shape", () => {
      const expected = E.right({ users: expect.any(Optional) });
      expect(normalized).toStrictEqual(expected);
    });

    test("getOption", () => {
      const state = { users: [{ id: "2" }] };

      const result = pipe(
        normalized,
        E.map((optional) => optional.users.getOption(state))
      );

      const expected = E.right(O.some([{ id: "2" }]));
      expect(result).toStrictEqual(expected);
    });

    test("set", () => {
      const state = { users: [] };
      const data = [{ id: "2" }];

      const result = pipe(
        normalized,
        E.map((optional) => optional.users.set(data)),
        E.ap(E.right(state))
      );

      const expected = E.right({ users: [{ id: "2" }] });
      expect(result).toStrictEqual(expected);
    });
  });

  describe("Two entities, no relationships", () => {
    type User = {
      id: string;
    };

    type Post = {
      id: string;
    };

    const users = () => makeEntity<User>()();
    const posts = () => makeEntity<Post>()();
    const schema = { users, posts };
    const normalized = normalize(schema);

    test("Normalized object shape", () => {
      const expected = E.right({
        users: expect.any(Optional),
        posts: expect.any(Optional),
      });

      expect(normalized).toStrictEqual(expected);
    });

    test("getOption for both", () => {
      const state = { users: [{ id: "2" }], posts: [{ id: "5" }] };

      const usersGet = pipe(
        normalized,
        E.map((optional) => optional.users.getOption(state))
      );

      const userExpected = E.right(O.some([{ id: "2" }]));
      expect(usersGet).toStrictEqual(userExpected);

      const postsGet = pipe(
        normalized,
        E.map((optional) => optional.posts.getOption(state))
      );

      const postsExpected = E.right(O.some([{ id: "5" }]));
      expect(postsGet).toStrictEqual(postsExpected);
    });

    describe("set", () => {
      const state = { users: [], posts: [] };

      test("users", () => {
        const usersSet = pipe(
          normalized,
          E.map((optional) => optional.users.set([{ id: "2" }])),
          E.ap(E.right(state))
        );

        const usersExpected = E.right({
          users: [{ id: "2" }],
          posts: [],
        });
        expect(usersSet).toStrictEqual(usersExpected);
      });

      test("posts", () => {
        const postsSet = pipe(
          normalized,
          E.map((optional) => optional.posts.set([{ id: "5" }])),
          E.ap(E.right(state))
        );

        const postsExpected = E.right({
          posts: [{ id: "5" }],
          users: [],
        });
        expect(postsSet).toStrictEqual(postsExpected);
      });
    });
  });

  describe.skip("Two entities, one relationships", () => {
    type User = {
      id: string;
    };

    type Post = {
      id: string;
      author: User;
    };

    const users = () => makeEntity<User>()();
    const posts = () => makeEntity<Post>()({ author: users });
    const schema = { users, posts };
    const normalized = normalize(schema);

    test("Normalized object shape", () => {
      const expected = E.right({
        users: expect.any(Optional),
        posts: expect.any(Optional),
      });

      expect(normalized).toStrictEqual(expected);
    });

    test("getOption for both", () => {
      const state = { users: [{ id: "2" }], posts: [{ id: "5", author: "2" }] };

      const usersGet = pipe(
        normalized,
        E.map((optional) => optional.users.getOption(state))
      );

      const userExpected = E.right(O.some([{ id: "2" }]));
      expect(usersGet).toStrictEqual(userExpected);

      const postsGet = pipe(
        normalized,
        E.map((optional) => optional.posts.getOption(state))
      );

      const postsExpected = E.right(O.some([{ id: "5", author: { id: "2" } }]));
      expect(postsGet).toStrictEqual(postsExpected);
    });

    test("set", () => {
      const state = { users: [], posts: [{ id: "4", author: "3" }] };

      const usersSet = pipe(
        normalized,
        E.map((optional) => optional.users.set([{ id: "2" }])),
        E.ap(E.right(state))
      );

      const usersExpected = E.right({ users: [{ id: "2" }] });
      expect(usersSet).toStrictEqual(usersExpected);

      const postsSet = pipe(
        normalized,
        E.map((optional) => optional.posts.set([{ id: "5" }])),
        E.ap(E.right(state))
      );

      const postsExpected = E.right({ posts: [{ id: "5" }] });
      expect(postsSet).toStrictEqual(postsExpected);
    });
  });
});
