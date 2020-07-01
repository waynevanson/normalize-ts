# normalize-ts

Lenses for normalized state.

## Installation

Please note that `fp-ts` and `monocle-ts` are peer dependencies.

```
yarn add normalize-ts fp-ts monocle-ts

npm install normalize-ts fp-ts monocle-ts

```

## Why?

There are a few out in the community already, with `normalizr` being the most popular.
The problem with these are that the Typescript support could be improved and they're imperative by design.
With the many users shifting to a more functional paradigm, we need something more suited.

## How to use

The mental model is to:

1. Create the Entities by using `createEntity`
2. Create the Schema by adding the entities

```ts
// // Create a schema with entities

type User = {
  id: string;
  name: string;
  posts: Post[];
};

type Post = {
  id: string;
  title: string;
  description: string;
  author: User;
  collaborators: User[];
};

// ENTITIES
const user: Entity<User,'posts'> =  createEntity(() => ({
  posts: [post]
}))

const post: Entity<Post, 'author'|'collaborators'> = createEntity(() => ({
  author: user
  collaborators: [user]
}))

// SCHEMA
const schema = {
  users: user,
  posts: post
}

// GET THE MAGIC
const normalize = normalization(schema)

const denormalized = {
  posts: {
    "99": {
      id: "99",
      title: "swampville",
      description: "shrek living happily ever after with his misses",
      author: {
        id: "11",
        name: "shrek",
        posts: ["99"],
      },
      collaborators: [
        {
          id: "22",
          name: "fiona",
          posts: ["99"],
        },
      ],
    },
  },
};

const normalized = {
  users: {
    "11": {
      id: "11",
      name: "shrek",
      posts: ["99"],
    },
    "22": {
      id: "22",
      name: "fiona",
      posts: ["99"],
    },
  },
  posts: {
    "99": {
      id: "99",
      title: "swampville",
      description: "shrek living happily ever after with his misses",
      author: "11",
      collaborators: ["22"],
    },
  },
};

expect(normalize.posts.getOption(normalized)).toStrictEqual(denormalized)

// set the posts using denormalized data,
// transforming it into normalized dataa
expect(normalize.users.set(normalized.posts)).toStrictEqual(normalized)

```
