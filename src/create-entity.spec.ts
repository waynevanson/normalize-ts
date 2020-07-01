import { createEntity, Entity } from "./create-entity";

describe("Entity", () => {
  test("An entity with no resolvers returns", () => {
    type User = { id: string };

    const user = createEntity<User>();

    const result = user.resolvers();

    const expected = {};

    expect(result).toMatchObject(expected);
  });

  test("An entity with a many-to-one relationship returns the resolver of itself.", () => {
    type User = { id: string; post: Post };
    type Post = { id: string };

    const user: Entity<User, "post"> = createEntity(() => ({ post }));
    const post: Entity<Post> = createEntity();

    const result = user.resolvers();
    const expected = { post };

    expect(result).toMatchObject(expected);
  });
});
