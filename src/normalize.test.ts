import { option as O } from "fp-ts";
import { makeEntity } from "./entity";
import { normalize, _normalizer } from "./normalize";

describe(normalize, () => {
  describe("one entity, no resolvers", () => {
    type User = { id: string };
    const users = () => makeEntity<User>()({});
    const normalized = normalize({ users });

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
        users: {
          "11": { id: "11" },
          "22": { id: "22" },
        },
      });
    });
  });

  describe("two entities, no resolvers", () => {
    type User = { id: string };
    type Post = { id: string };
    const users = () => makeEntity<User>()({});
    const posts = () => makeEntity<Post>()({});
    const normalized = normalize({ users, posts });

    const data = Object.freeze({
      users: {
        "11": { id: "11" },
      },
      posts: {
        "33": { id: "33" },
      },
    });

    test("the shape", () => {
      expect(normalized).toEqual({
        users: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
        posts: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
      });
    });

    test("getOption", () => {
      expect(normalized.users.getOption(data)).toEqual(O.some([{ id: "11" }]));
      expect(normalized.posts.getOption(data)).toEqual(O.some([{ id: "33" }]));
    });

    test("set", () => {
      expect(normalized.users.set([{ id: "22" }])(data)).toEqual({
        users: {
          "11": { id: "11" },
          "22": { id: "22" },
        },
        posts: {
          "33": { id: "33" },
        },
      });
      expect(normalized.posts.set([{ id: "44" }])(data)).toEqual({
        users: {
          "11": { id: "11" },
        },
        posts: {
          "33": { id: "33" },
          "44": { id: "44" },
        },
      });
    });
  });

  describe("two entities, one resolver as single", () => {
    type User = { id: string };
    type Post = { id: string; author: User };

    const users = () => makeEntity<User>()({});
    const posts = () =>
      makeEntity<Post>()({
        author: users,
      });
    const normalized = normalize({ users, posts });

    const data = {
      users: {
        "11": { id: "11" },
      },
      posts: {
        "33": { id: "33", author: "11" },
      },
    };

    test("the shape", () => {
      expect(normalized).toEqual({
        users: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
        posts: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
      });
    });

    test("getOption", () => {
      expect(normalized.users.getOption(data)).toEqual(O.some([{ id: "11" }]));
      expect(normalized.posts.getOption(data)).toEqual(
        O.some([{ id: "33", author: { id: "11" } }])
      );
    });

    test("set", () => {
      expect(normalized.users.set([{ id: "22" }])(data)).toEqual({
        users: {
          "11": { id: "11" },
          "22": { id: "22" },
        },
        posts: {
          "33": { id: "33", author: "11" },
        },
      });

      expect(
        normalized.posts.set([{ id: "44", author: { id: "22" } }])(data)
      ).toEqual({
        users: {
          "11": { id: "11" },
          "22": { id: "22" },
        },
        posts: {
          "33": { id: "33", author: "11" },
          "44": { id: "44", author: "22" },
        },
      });
    });
  });

  describe("two entities, one resolver as many", () => {
    type User = { id: string };
    type Post = { id: string; author: User[] };

    const users = () => makeEntity<User>()({});
    const posts = () =>
      makeEntity<Post>()({
        author: [users],
      });
    const normalized = normalize({ users, posts });

    const data = {
      users: {
        "11": { id: "11" },
      },
      posts: {
        "33": { id: "33", author: ["11"] },
      },
    };

    test("the shape", () => {
      expect(normalized).toEqual({
        users: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
        posts: {
          _tag: "Optional",
          getOption: expect.any(Function),
          set: expect.any(Function),
        },
      });
    });

    test("getOption", () => {
      expect(normalized.users.getOption(data)).toEqual(O.some([{ id: "11" }]));
      expect(normalized.posts.getOption(data)).toEqual(
        O.some([{ id: "33", author: [{ id: "11" }] }])
      );
    });

    test("set", () => {
      expect(normalized.users.set([{ id: "22" }])(data)).toEqual({
        users: {
          "11": { id: "11" },
          "22": { id: "22" },
        },
        posts: {
          "33": { id: "33", author: ["11"] },
        },
      });

      expect(
        normalized.posts.set([{ id: "44", author: [{ id: "22" }] }])(data)
      ).toEqual({
        users: {
          "11": { id: "11" },
          "22": { id: "22" },
        },
        posts: {
          "33": { id: "33", author: ["11"] },
          "44": { id: "44", author: ["22"] },
        },
      });
    });
  });
});
