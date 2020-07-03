import { URIS } from "fp-ts/lib/HKT";
import { SchemaInternalBase } from "./schema";
import { Lens } from "monocle-ts";

// entity will be Lens for the property and an entity for the plural.
// shorthand can be a record, but the rest has to be pairs like a tuple or a map.
//
// schematics is no longer a bunch of strings.
// schematics is now matching a lens to an entity, replacing the entity with a string.
//
export const get = <F extends URIS, I, G extends URIS>(
  plural: string,
  ta: [Lens<any, any>, string][],
  schema: SchemaInternalBase
) => (s: any) => {};
