import { Lens } from "monocle-ts";
import { definement as DF } from "refinement-ts";

export const isEntity = DF.fromRefinement(
  (a: unknown): a is Record<"_tag", "Entity"> =>
    a instanceof Object &&
    a.constructor.name === "Object" &&
    (a as Record<any, unknown>)._tag === "Entity"
);

// USER FACING
export interface Entity<A extends RecordData, R extends Relationships> {
  readonly _tag: "Entity";
  readonly _A: A;
  relationships: R;
  lens: Lens<RecordData, string>;
}

export interface EntityOptions<A> {
  lens: Lens<A, string>;
}

export type RecordID = Record<"id", string>;

export function makeEntity<A extends RecordData & RecordID>(): <
  R extends RelationshipMap<A>
>(
  relationships: R
) => Entity<A, R>;

export function makeEntity<A extends RecordData>(): <
  R extends RelationshipMap<A>
>(
  relationships: R,
  options: EntityOptions<A>
) => Entity<A, R>;

export function makeEntity<A extends RecordData>() {
  return <R extends RelationshipMap<A>>(
    relationships = {} as R,
    { lens } = { lens: Lens.fromProp<any>()("id") } as EntityOptions<A>
  ): Entity<A, R> => ({
    _tag: "Entity",
    _A: null as any,
    relationships,
    //@ts-expect-error
    lens,
  });
}

export type Primitive = string | number | boolean;
export type PrimitiveValue = Primitive | Array<Primitive>;
export type RecordDataSelf = RecordData | Array<RecordData>;
export type RecordDataValue = PrimitiveValue | RecordDataSelf;
export type RecordData = { [x: string]: RecordDataValue };

export interface LazyEntity<T extends RecordData, R extends Relationships> {
  (): Entity<T, R>;
}

export type RelationshipValue =
  | LazyEntity<any, Relationships>
  | [LazyEntity<any, Relationships>];

export type Relationships = Record<string, RelationshipValue | undefined>;

export type EnitableKeys<T extends RecordData> = {
  [P in keyof T]: T[P] extends RecordData | RecordData[] ? P : never;
}[keyof T];

export type RelationshipMap<A extends RecordData> = Partial<
  Pick<
    {
      [P in keyof A]: A[P] extends Array<infer U>
        ? U extends RecordData
          ? [LazyEntity<U, any>]
          : never
        : A[P] extends RecordData
        ? LazyEntity<A[P], any>
        : never;
    },
    EnitableKeys<A>
  >
>;
