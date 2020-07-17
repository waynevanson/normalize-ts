export interface Entity<A extends RecordData, R extends Relationships> {
  readonly _tag: "Entity";
  readonly _A: A;
  relationships: R;
}

export function makeEntity<A extends RecordData>() {
  return <R extends RelationshipMap<A>>(
    relationships = {} as R
  ): Entity<A, R> => ({
    _tag: "Entity",
    _A: null as any,
    relationships,
  });
}

export type RecordUnknown = Record<string, unknown>;
export type RecordID = Record<"id", string>;
export type RecordData = RecordID & RecordUnknown;

export type EnitableKeys<T extends RecordData> = {
  [P in keyof T]: T[P] extends RecordData | RecordData[] ? P : never;
}[keyof T];

export type RelationshipMap<A extends RecordData> = Partial<
  Omit<
    Pick<
      {
        [P in keyof A]: A[P] extends Array<infer U>
          ? U extends RecordData
            ? [() => Entity<U, any>]
            : never
          : A[P] extends RecordData
          ? () => Entity<A[P], any>
          : never;
      },
      EnitableKeys<A>
    >,
    "id"
  >
>;

export interface LazyEntity {
  (): Entity<any, Relationships>;
}

export type RelationshipValue = LazyEntity | [LazyEntity];

export type Relationships = Record<string, RelationshipValue | undefined>;
