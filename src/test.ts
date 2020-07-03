import { makeEntity } from "./make-entity";
import { tuple } from "fp-ts/lib/function";
import { Lens } from "monocle-ts";
import { SchemaInternal } from "./schema";
import { Normalize } from "./normalize";

// TEST
type User = { id: string };
type Post = { id: string; author: User; collaborators: User[] };

const users = () => makeEntity<User>()([]);
const posts = () =>
  makeEntity<Post>()([
    tuple(Lens.fromProp<Post>()("author"), users),
    tuple(Lens.fromProp<Post>()("collaborators"), users),
  ]);

const schema = { users, posts };

type SchemaInternalTest = SchemaInternal<typeof schema>;
type NormalizeTest = Normalize<typeof schema, "Record">;
