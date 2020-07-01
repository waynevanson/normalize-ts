import { array, either, show } from "fp-ts";
import { pipe } from "fp-ts/lib/pipeable";

export const monoidInfos = array.getMonoid<Info>();

export const showEitherString = either.getShow(
  show.showString,
  show.showString
);

export const showObject: show.Show<object> = {
  show: (object) =>
    pipe(
      either.tryCatch(() => JSON.stringify(object, undefined, 2), String),
      showEitherString.show
    ),
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
