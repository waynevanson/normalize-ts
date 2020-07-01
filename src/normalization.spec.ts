import { option as O } from "fp-ts";
import { createEntity, Entity } from "./create-entity";
import { normalization } from "./normalization";
import { pipe } from "fp-ts/lib/function";

describe(normalization, () => {
  describe("getOption", () => {
    test("retrieve a dictionary from the normalized, without recursion", () => {
      type User = {
        id: string;
      };

      const users = createEntity<User>();
      const user11: User = { id: "11" };
      const schema = { users };

      const e = { "11": user11 };

      const normalized = { users: e };
      const normalize = normalization(schema);

      const result = normalize.users.getOption(normalized);

      const expected = O.some(e);

      expect(result).toMatchObject(expected);
    });

    test("retrieve a dictionary from the normalized, with recursion 1 deep", () => {
      type User = {
        id: string;
      };

      type Post = { id: string; author: User };

      const users = createEntity<User>();
      const posts = createEntity<Post, "author">(() => ({ author: users }));
      const schema = { users, posts };
      const normalize = normalization(schema);

      const data = {
        users: { "11": { id: "11" } },
        posts: { "22": { id: "22", author: "11" } },
      };

      expect(normalize.users.getOption(data)).toMatchObject(
        O.some({ "11": { id: "11" } })
      );

      expect(normalize.posts.getOption(data)).toMatchObject(
        O.some({ "22": { id: "22", author: { id: "11" } } })
      );
    });

    test("retrieve a dictionary from the normalized, with recursion 2 deep", () => {
      type User = {
        id: string;
        group: Group;
      };

      type Post = { id: string; author: User };

      type Group = {
        id: string;
        name: string;
      };

      const users: Entity<User, "group"> = createEntity(() => ({
        group: groups,
      }));

      const posts: Entity<Post, "author"> = createEntity(() => ({
        author: users,
      }));

      const groups: Entity<Group> = createEntity();

      const schema = { users, posts, groups };
      const normalize = normalization(schema);

      const data = {
        users: { "11": { id: "11", group: "33" } },
        posts: { "22": { id: "22", author: "11" } },
        groups: { "33": { id: "33", name: "admin" } },
      };

      expect(normalize.users.getOption(data)).toMatchObject(
        O.some({ "11": { id: "11", group: { id: "33", name: "admin" } } })
      );

      expect(normalize.posts.getOption(data)).toMatchObject(
        O.some({
          "22": {
            id: "22",
            author: { id: "11", group: { id: "33", name: "admin" } },
          },
        })
      );

      expect(normalize.groups.getOption(data)).toMatchObject(
        O.some({ "33": { id: "33", name: "admin" } })
      );
    });
  });

  describe("set", () => {
    test("set a dictionary from the normalized, without recursion", () => {
      type User = {
        id: string;
      };

      const users = createEntity<User>();

      const schema = { users };
      const normalize = normalization(schema);

      expect(
        pipe({ users: {} }, normalize.users.set({ "11": { id: "11" } }))
      ).toMatchObject({
        users: { "11": { id: "11" } },
      });
    });

    test("set a dictionary from the normalized, with recursion 1 deep", () => {
      type User = {
        id: string;
      };

      type Post = { id: string; author: User };

      const users = createEntity<User>();
      const posts = createEntity<Post, "author">(() => ({ author: users }));
      const schema = { users, posts };
      const normalize = normalization(schema);

      expect(
        pipe(
          { users: {}, posts: {} },
          normalize.posts.set({ "22": { id: "22", author: { id: "11" } } })
        )
      ).toMatchObject({
        users: { "11": { id: "11" } },
        posts: { "22": { id: "22", author: "11" } },
      });
    });

    test("set a dictionary from the normalized, with recursion 2 deep", () => {
      type User = {
        id: string;
        group: Group;
      };

      type Post = { id: string; author: User };

      type Group = {
        id: string;
        name: string;
      };

      const users: Entity<User, "group"> = createEntity(() => ({
        group: groups,
      }));

      const posts: Entity<Post, "author"> = createEntity(() => ({
        author: users,
      }));

      const groups: Entity<Group> = createEntity();

      const schema = { users, posts, groups };
      const normalize = normalization(schema);

      expect(
        pipe(
          { users: {}, posts: {}, groups: {} },
          normalize.posts.set({
            "22": {
              id: "22",
              author: { id: "11", group: { id: "33", name: "admin" } },
            },
          })
        )
      ).toMatchObject({
        users: { "11": { id: "11", group: "33" } },
        posts: { "22": { id: "22", author: "11" } },
        groups: { "33": { id: "33", name: "admin" } },
      });
    });
  });
});
