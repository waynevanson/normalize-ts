import { URIS } from "fp-ts/lib/HKT";
import { SchemaInternalBase } from "./schema";
import { Lens } from "monocle-ts";
export const set = <F extends URIS, I, G extends URIS>(
  plural: string,
  ta: [Lens<any, any>, string][],
  schema: SchemaInternalBase
) => (a: any) => (s: any) => {};
