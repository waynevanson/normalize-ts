import {
  either as E,
  option as O,
  reader as R,
  readerEither as RE,
  record as RC,
  array as A,
} from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { Optional } from "monocle-ts";
import { makeEntity, RecordData } from "./entity";
import { getOptionMain } from "./get-option";
import { eitherV as EV } from "./higher-kinded-type";
import { makeResolversFromSchema, Resolver, Schema } from "./schema";
import { setMain } from "./set";

export type Dictionary = Array<RecordData>;
export type Normalized = Record<string, Dictionary>;

export interface NormalizeDeps {
  normalized: Normalized;
  resolvers: Resolver[];
}

export interface NormalizeOptions {
  debug: boolean;
}

const throughError = (logError: boolean) => <A>(a: A) => {
  logError ? console.error(a) : null;
  return a;
};

export function normalize<S extends Schema>(
  schema: S,
  { debug }: NormalizeOptions = { debug: false }
) {
  return pipe(
    makeResolversFromSchema(schema),
    EV.map((resolvers) =>
      pipe(
        schema,
        RC.mapWithIndex((plural) => {
          return new Optional(
            pipe(
              getOptionMain(plural),
              RE.local((normalized: Normalized) => ({ normalized, resolvers })),
              R.map(
                E.fold(
                  flow(throughError(debug), () => O.none),
                  O.some
                )
              )
            ),
            (a) =>
              pipe(
                setMain(plural, a as Dictionary),
                R.chain((z) =>
                  pipe(
                    R.asks(({ normalized }: NormalizeDeps) => normalized),
                    R.map((cc) =>
                      RC.getMonoid(A.getMonoid<RecordData>()).concat(
                        cc,
                        RC.singleton(plural, z)
                      )
                    )
                  )
                ),
                R.local(
                  (normalized): NormalizeDeps => ({ normalized, resolvers })
                )
              )
          );
        })
      )
    )
  );
}

// get
// getOption on dictionary
// get matching reducers
//
//
// set
//

// tests
type User = {
  id: string;
  posts: Post[];
};

type Post = {
  id: string;
  author: User;
};

const users = () => makeEntity<User>()({ posts: [posts] });

const posts = () => makeEntity<Post>()({ author: users });

const schema = { users, posts };
const resolvers = makeResolversFromSchema(schema);
