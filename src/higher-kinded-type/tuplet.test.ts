import * as tuplet from "./tuplet";

describe("tuplet", () => {
  describe(tuplet.fold, () => {
    it("Extracts the value out of a tuplet", () => {
      const r = tuplet.fold([8]);
      expect(r).toBe(8);
    });
  });

  describe(tuplet.enforceNotTuplet, () => {
    it("Leaves the value as a non tuplet", () => {
      const r = tuplet.enforceNotTuplet(4);
      expect(r).toBe(4);
    });

    it("Extracts the value out of a tuplet", () => {
      const r = tuplet.enforceNotTuplet([4]);
      expect(r).toBe(4);
    });
  });

  describe(tuplet.enforceTuplet, () => {
    it("Leaves the value as a tuplet", () => {
      const r = tuplet.enforceTuplet([4]);
      expect(r).toStrictEqual([4]);
    });

    it("Transforms the value into a tuplet", () => {
      const r = tuplet.enforceTuplet(4);
      expect(r).toStrictEqual([4]);
    });
  });

  describe(tuplet.isTuplet, () => {
    it("Returns true when value is a tuplet", () => {
      const r = tuplet.isTuplet([45]);
      expect(r).toBeTruthy();
    });

    it("Returns false when value is a tuplet", () => {
      const r = tuplet.isTuplet(45);
      expect(r).toBeFalsy();
    });
  });

  describe(tuplet.isNotTuplet, () => {
    it("Returns false when value is a tuplet", () => {
      const r = tuplet.isNotTuplet([45]);
      expect(r).toBeFalsy();
    });

    it("Returns true when value is a tuplet", () => {
      const r = tuplet.isNotTuplet(45);
      expect(r).toBeTruthy();
    });
  });

  describe("monad", () => {
    test(tuplet.tuplet.of.name, () => {
      const r = tuplet.tuplet.of(0);
      expect(r).toStrictEqual([0]);
    });

    test(tuplet.tuplet.map.name, () => {
      const r = tuplet.tuplet.map([76], (a) => a + 24);
      expect(r).toStrictEqual([100]);
    });

    test(tuplet.tuplet.ap.name, () => {
      const r = tuplet.tuplet.ap([(a: number) => a + 37], [63]);
      expect(r).toStrictEqual([100]);
    });

    test(tuplet.tuplet.chain.name, () => {
      const r = tuplet.tuplet.chain([45], (a) => [a + 55]);
      expect(r).toStrictEqual([100]);
    });

    test(tuplet.tuplet.mapWithIndex.name, () => {
      const r = tuplet.tuplet.mapWithIndex([13], (i, a) => ({ i, a }));
      expect(r).toStrictEqual([{ i: 0, a: 13 }]);
    });
  });
});
