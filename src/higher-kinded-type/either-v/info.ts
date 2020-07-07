import { array, show } from "fp-ts";
import { inspect } from "util";

export const monoidInfos = array.getMonoid<Info>();

export const showObject: show.Show<object> = {
  show: (object) =>
    inspect(object, { getters: true, sorted: true, depth: null }),
};

export const showInfo = show.getStructShow<Info>({
  message: show.showString,
  data: showObject,
});

export const showInfos = array.getShow(showInfo);

export type Info<T = any> = {
  message: string;
  data: Record<string, T>;
};

export type Infos = Array<Info>;
