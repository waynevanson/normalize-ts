import { makeSchema } from "./schema";
import { makeEntity } from "./entity";
import { normalize, denormalize, NormalizrEntity } from "./normalizr";
import { schema as _schema } from "normalizr";
describe(makeSchema, () => {
  test("Create a schema from one entity and no resolvers", () => {
    type User = { id: string };

    const users = () => makeEntity<User>()({});

    const schema = makeSchema({ users });

    expect(schema.entities).toMatchObject({
      users: [{ schema: {} }],
    });
  });

  test("Create a schema from a two entities and no resolvers", () => {
    type User = { id: string };
    type Post = { id: string };

    const users = () => makeEntity<User>()({});
    const posts = () => makeEntity<Post>()({});

    const schema = makeSchema({ users, posts });

    expect(schema.entities).toMatchObject({
      users: [{ schema: {} }],
      posts: [{ schema: {} }],
    });
  });

  test("Create a schema from a two entities and one resolver", () => {
    type User = { id: string };
    type Post = { id: string; author: User };

    const users = () => makeEntity<User>()({});
    const posts = () => makeEntity<Post>()({ author: users });

    const schema = makeSchema({ users, posts });
    expect(schema.entities).toMatchObject({
      users: [{ schema: {} }],
      posts: [{ schema: { author: { schema: {} } } }],
    });
  });
});
