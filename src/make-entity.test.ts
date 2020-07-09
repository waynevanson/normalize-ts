import { tuple } from "fp-ts/lib/function";
import { Lens } from "monocle-ts";
import { makeEntity } from "./make-entity";
import { Entity } from "./types/entity";

describe(makeEntity, () => {
  test("creates the most basic entity", () => {
    type User = {
      id: string;
    };

    const lensPrimaryKey = Lens.fromProp<User>()("id");
    const relationships: never[] = [];

    const users = () => makeEntity<User>()(lensPrimaryKey, relationships);

    expect(users()).toMatchObject<
      Entity<User, typeof lensPrimaryKey, typeof relationships>
    >({ lensPrimaryKey, relationships });
  });

  test("creates the most basic entities with potential but no mapping", () => {
    type User = {
      id: string;
    };

    type Post = {
      id: string;
      author: User;
    };

    const relationships: never[] = [];

    const lensUser = Lens.fromProp<User>()("id");
    const users = () => makeEntity<User>()(lensUser, relationships);

    const lensPost = Lens.fromProp<Post>()("id");
    const posts = () => makeEntity<Post>()(lensPost, relationships);

    expect(users()).toMatchObject<
      Entity<User, typeof lensUser, typeof relationships>
    >({ lensPrimaryKey: lensUser, relationships });

    expect(posts()).toMatchObject<
      Entity<Post, typeof lensPost, typeof relationships>
    >({ lensPrimaryKey: lensPost, relationships });
  });

  test("creates the most basic entities with potential with a mapping one", () => {
    type User = {
      id: string;
    };

    type Post = {
      id: string;
      author: User;
    };

    const lensUser = Lens.fromProp<User>()("id");
    const usersRelationships: never[] = [];
    const users = () => makeEntity<User>()(lensUser, usersRelationships);

    const lensPost = Lens.fromProp<Post>()("id");
    const postsRelationships = [tuple(Lens.fromProp<Post>()("author"), users)];
    const posts = () => makeEntity<Post>()(lensPost, postsRelationships);

    expect(users()).toMatchObject<
      Entity<User, typeof lensUser, typeof usersRelationships>
    >({ lensPrimaryKey: lensUser, relationships: usersRelationships });

    expect(posts()).toMatchObject<
      Entity<Post, typeof lensPost, typeof postsRelationships>
    >({ lensPrimaryKey: lensPost, relationships: postsRelationships });
  });

  test("creates the most basic entities with potential with a mapping many", () => {
    type User = {
      id: string;
    };

    type Post = {
      id: string;
      collaborators: User[];
    };

    const lensUser = Lens.fromProp<User>()("id");
    const usersRelationships: never[] = [];
    const users = () => makeEntity<User>()(lensUser, usersRelationships);

    const lensPost = Lens.fromProp<Post>()("id");
    const postsRelationships = [
      tuple(Lens.fromProp<Post>()("collaborators"), tuple(users)),
    ];
    const posts = () => makeEntity<Post>()(lensPost, postsRelationships);

    expect(users()).toMatchObject<
      Entity<User, typeof lensUser, typeof usersRelationships>
    >({ lensPrimaryKey: lensUser, relationships: usersRelationships });

    expect(posts()).toMatchObject<
      Entity<Post, typeof lensPost, typeof postsRelationships>
    >({ lensPrimaryKey: lensPost, relationships: postsRelationships });
  });
});
