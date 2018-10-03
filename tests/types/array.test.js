import expect from 'expect';

import ArrayType from '../../src/types/array';
import { create } from '../../src/microstates';

describe("ArrayType", function() {
  describe("when unparameterized", function() {
    let ms;
    let array = ["a", "b", "c"];

    beforeEach(() => {
      ms = create(ArrayType, array);
    });

    describe("push", () => {
      let pushed;
      beforeEach(() => {
        pushed = ms.push("d");
      });

      it("has state", () => {
        expect(pushed.state).toEqual(["a", "b", "c", "d"]);
      });

      describe("again", () => {
        let again;

        beforeEach(() => {
          again = pushed.push("e");
        });

        it("has state", () => {
          expect(again.state).toEqual(["a", "b", "c", "d", "e"]);
        });
      });
    });

    describe("pop", () => {
      let popped;
      beforeEach(() => {
        popped = ms.pop();
      });

      it("has state", () => {
        expect(popped.state).toEqual(["a", "b"]);
      });

      describe("again", () => {
        let again;

        beforeEach(() => {
          again = popped.pop();
        });

        it("has state", () => {
          expect(again.state).toEqual(["a"]);
        });
      });
    });

    describe("filter", () => {
      let filtered;

      beforeEach(() => {
        filtered = ms.filter(v => v.state !== "a");
      });

      it("state", () => {
        expect(filtered.state).toEqual(["b", "c"]);
      });
    });

    describe("map", () => {
      let mapped;

      beforeEach(() => {
        mapped = ms.map(v => v.state.toUpperCase());
      });

      it("state", () => {
        expect(mapped.state).toEqual(["A", "B", "C"]);
      });
    });
  });

  describe("when parameterized", () => {
    class Record {
      content = create(class StringType {
        concat(value) {
          return String(this.state) + String(value);
        }
      });
    }
    class Dataset {
      records = create(ArrayType.of(Record), []);
    }

    describe('empty data set', () => {
      let dataset;
      beforeEach(() => {
        dataset = create(Dataset, { records: [] });
      });

      describe("pushing a record", () => {
        let pushed;
        beforeEach(() => {
          pushed = dataset.records.push({ content: "Hi!" });
        });

        it("has the new record", () => {
          expect(pushed.records[0]).toBeInstanceOf(Record);
        });

        it("has given value", () => {
          expect(pushed.state.records[0].content).toBe("Hi!");
        });

        describe("changing record", () => {
          let changed;
          beforeEach(() => {
            changed = pushed.records[0].content.set("Hello!");
          });

          it("has changed value", () => {
            expect(changed.state.records[0].content).toBe("Hello!");
          });

          describe("popping a record", () => {
            let popped;
            beforeEach(() => {
              popped = changed.records.pop();
            });

            it("does not have any records", () => {
              expect(popped.state.records[0]).toBe(undefined);
            });
          });
        });
      });
    });

    describe('preloaded data set', () => {
      let dataset;
      beforeEach(() => {
        dataset = create(Dataset, { records: [
          {content: 'Herro'},
          {content: 'Sweet'},
          {content: "Woooo"}
        ]});
      });

      describe("push", () => {
        let pushed;
        beforeEach(() => {
          pushed = dataset.records.push({ content: "Hi!" });
        });

        it("has the new record", () => {
          expect(pushed.records[3]).toBeInstanceOf(Record);
        });

        it("has given value", () => {
          expect(pushed.state.records[3].content).toBe("Hi!");
        });

        describe("changing record", () => {
          let changed;
          beforeEach(() => {
            changed = pushed.records[3].content.set("Hello!");
          });

          it("has changed value", () => {
            expect(changed.state.records[3].content).toBe("Hello!");
          });
        });
      });

      describe('pop', () => {
        let popped;
        beforeEach(() => {
          popped = dataset.records.pop();
        });

        it('removed last element from the array', () => {
          expect(popped.records[2]).toBe(undefined);
        });

        it('changed length', () => {
          expect(popped.records.state.length).toBe(2);
        });

        describe('changing record', () => {
          let changed;
          beforeEach(() => {
            changed = popped.records[1].content.concat('!!!');
          });

          it('changed the content', () => {
            expect(changed.records[1].content.state).toBe('Sweet!!!');
          });
        });
      });

      describe('shift', () => {
        let shifted;
        beforeEach(() => {
          shifted = dataset.records.shift();
        });

        it('removed first element from the array', () => {
          expect(shifted.records[0].content.state).toBe('Sweet');
        });

        it('changed length', () => {
          expect(shifted.records.state.length).toBe(2);
        });

        describe('changing record', () => {
          let changed;
          beforeEach(() => {
            changed = shifted.records[1].content.concat('!!!');
          });

          it('changed the content', () => {
            expect(changed.records[1].content.state).toBe('Woooo!!!');
          });
        });
      });

      describe('unshift', () => {
        let unshifted;
        beforeEach(() => {
          unshifted = dataset.records.unshift({ content: "Hi!" });
        });
        it('pushed record to the beginning of the array', () => {
          expect(unshifted.records[0].content.state).toBe('Hi!');
        });
        it('moved first record to second position', () => {
          expect(unshifted.records[1].content.state).toBe('Herro');
        });

        describe('change new record', () => {
          let changed;
          beforeEach(() => {
            changed = unshifted.records[0].content.concat('!!!');
          });
          it('changed new record', () => {
            expect(changed.records[0].content.state).toBe('Hi!!!!');
          });
        });

        describe('change existing record', () => {
          let changed;
          beforeEach(() => {
            changed = unshifted.records[1].content.concat('!!!');
          });
          it('changed new record', () => {
            expect(changed.records[1].content.state).toBe('Herro!!!');
          });
        });
      });

      describe('filter', () => {
        let filtered;
        beforeEach(() => {
          filtered = dataset.records.filter(record => record.state.content[0] === 'S');
        });

        it('filtered out items', () => {
          expect(filtered.records.state.length).toBe(1);
        });

        describe('changing remaining item', () => {
          let changed;
          beforeEach(() => {
            changed = filtered.records[0].content.concat('!!!');
          });

          it('it changed the state', () => {
            expect(changed.records[0].content.state).toBe('Sweet!!!');
          });
        });
      });

      describe('map', () => {
        describe('with microstate operations', () => {
          let mapped;
          beforeEach(() => {
            mapped = dataset.records.map(record => record.content.concat('!!!'))
          });

          it('applied change to every element', () => {
            expect(mapped.records[0].content.state).toBe('Herro!!!');
            expect(mapped.records[1].content.state).toBe('Sweet!!!');
            expect(mapped.records[2].content.state).toBe('Woooo!!!');
          });

          describe('changing record', () => {
            let changed;
            beforeEach(() => {
              changed = mapped.records[1].content.set('SWEET!!!');
            });

            it('changed the record content', () => {
              expect(changed.records[1].content.state).toBe('SWEET!!!');
            });
          });
        });
      });

      describe('clear', () => {
        let cleared;
        beforeEach(() => {
          cleared = dataset.records.clear();
        });

        it('makes array empty', () => {
          expect(cleared.records.state).toEqual([]);
        });

        it('has empty value', () => {
          expect(cleared.state).toEqual({ records: [] });
        });
      });

    });

  });
});
