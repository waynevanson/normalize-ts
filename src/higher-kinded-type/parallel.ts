import { URIS } from "fp-ts/lib/HKT";
import { Monad1 } from "fp-ts/lib/Monad";

// map is bimap
// chain chains both
export const bimap = <G extends URIS>(ma: Monad1<G>) => {};
