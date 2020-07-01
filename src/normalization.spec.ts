import { normalization } from "./normalization";
import { createEntity } from "./create-entity";
import { option as O } from "fp-ts";

describe(normalization, () => {
  test("gets a single lens", () => {
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

  test("gets a single lens", () => {
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
});
