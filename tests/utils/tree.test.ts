import 'jest';

import * as get from 'lodash.get';

import MicrostateArray from '../../src/primitives/array';
import MicrostateBoolean from '../../src/primitives/boolean';
import MicrostatesNumber from '../../src/primitives/number';
import MicrostateObject from '../../src/primitives/object';
import MicrostateString from '../../src/primitives/string';
import Tree from '../../src/utils/tree';

let has = (subject, property, value) =>
  it(`has ${property} as ${value}`, () => expect(get(subject, property)).toEqual(value));

describe('Tree', () => {
  describe('primitives', () => {
    describe('number', () => {
      let number = Tree.from(Number);
      has(number, 'data.path', []);
      has(number, 'data.isPrimitive', true);
      has(number, 'data.isComposed', false);
      has(number, 'data.isParameterized', false);
      has(number, 'data.isList', false);
      has(number, 'data.properties', undefined);
      has(number, 'data.schemaType', Number);
      has(number, 'data.type', MicrostatesNumber);
      has(number, 'data.of', null);
      has(number, 'children', {});
      it('has transitions', () => {
        expect(number.data.transitions.set).toBeDefined();
        expect(number.data.transitions.increment).toBeDefined();
      });
    });
    describe('string', () => {
      let string = Tree.from(String);
      has(string, 'data.path', []);
      has(string, 'data.isPrimitive', true);
      has(string, 'data.isComposed', false);
      has(string, 'data.isParameterized', false);
      has(string, 'data.isList', false);
      has(string, 'data.properties', undefined);
      has(string, 'data.schemaType', String);
      has(string, 'data.type', MicrostateString);
      has(string, 'data.of', null);
      it('has transitions', () => {
        expect(string.data.transitions.set).toBeDefined();
        expect(string.data.transitions.concat).toBeDefined();
      });
    });
    describe('boolean', () => {
      let boolean = Tree.from(Boolean);
      has(boolean, 'data.path', []);
      has(boolean, 'data.isPrimitive', true);
      has(boolean, 'data.isComposed', false);
      has(boolean, 'data.isParameterized', false);
      has(boolean, 'data.isList', false);
      has(boolean, 'data.properties', undefined);
      has(boolean, 'data.schemaType', Boolean);
      has(boolean, 'data.type', MicrostateBoolean);
      has(boolean, 'data.of', null);
      it('has transitions', () => {
        expect(boolean.data.transitions.set).toBeDefined();
        expect(boolean.data.transitions.toggle).toBeDefined();
      });
    });
    describe('object', () => {
      let object = Tree.from(Object);
      has(object, 'data.path', []);
      has(object, 'data.isPrimitive', true);
      has(object, 'data.isComposed', false);
      has(object, 'data.isParameterized', false);
      has(object, 'data.isList', false);
      has(object, 'data.properties', undefined);
      has(object, 'data.schemaType', Object);
      has(object, 'data.type', MicrostateObject);
      has(object, 'data.of', null);
      it('has transitions', () => {
        expect(object.data.transitions.set).toBeDefined();
        expect(object.data.transitions.assign).toBeDefined();
        expect(object.data.transitions.merge).toBeDefined();
      });
    });
    describe('array', () => {
      function array_it(type) {
        let array = Tree.from(type);
        has(array, 'data.path', []);
        has(array, 'data.isPrimitive', true);
        has(array, 'data.isComposed', false);
        has(array, 'data.isParameterized', false);
        has(array, 'data.isList', true);
        has(array, 'data.properties', undefined);
        has(array, 'data.schemaType', type);
        has(array, 'data.type', MicrostateArray);
        has(array, 'data.of', null);
        it('has transitions', () => {
          expect(array.data.transitions.set).toBeDefined();
          expect(array.data.transitions.push).toBeDefined();
        });
      }
      describe('Array', () => {
        array_it(Array);
      });
      describe('[]', () => {
        array_it([]);
      });
    });
  });
  describe('composed', () => {
    describe('objects', () => {
      describe('transitions', () => {
        let tree;
        beforeEach(() => {
          tree = Tree.from(class {});
        });
        it('has set', () => {
          expect(tree.data.transitions.set).toBeDefined();
        });
        it('has merge', () => {
          expect(tree.data.transitions.merge).toBeDefined();
        });
        describe('initialize', () => {
          class WithInitialize {
            static initialize = () => {};
          }
          it('initialize transition is used when present', () => {
            expect(Tree.from(WithInitialize)).toHaveProperty(
              'data.transitions.initialize',
              WithInitialize.initialize
            );
          });
          describe('default', () => {
            let args, tree, p;
            class Plain {
              constructor(..._args) {
                args = _args;
              }
            }
            beforeEach(() => {
              tree = Tree.from(Plain);
              p = tree.data.transitions.initialize(null, 'a', 'b', 'c');
            });
            it('receives default when not specified', () => {
              expect(tree).toHaveProperty('data.transitions.initialize');
            });
            it('returns new instance of type', () => {
              expect(p).toBeInstanceOf(Plain);
            });
            it('passes args to constructor', () => {
              expect(args).toEqual(['a', 'b', 'c']);
            });
          });
        });
      });
      describe('without properties', () => {
        class Item {}
        let tree = Tree.from(Item);
        has(tree, 'data.path', []);
        has(tree, 'data.isPrimitive', false);
        has(tree, 'data.isComposed', true);
        has(tree, 'data.isParameterized', false);
        has(tree, 'data.isList', false);
        has(tree, 'data.schemaType', Item);
        has(tree, 'data.type', Item);
        has(tree, 'data.properties', undefined);
        has(tree, 'data.of', null);
      });
      describe('with children', () => {
        class Item {
          string = String;
          number = Number;
          boolean = Boolean;
          object = Object;
          array = Array;
        }
        let tree = Tree.from(Item);
        it('have paths', () => {
          expect(tree).toHaveProperty('children.string.data.path', ['string']);
          expect(tree).toHaveProperty('children.number.data.path', ['number']);
          expect(tree).toHaveProperty('children.boolean.data.path', ['boolean']);
          expect(tree).toHaveProperty('children.object.data.path', ['object']);
          expect(tree).toHaveProperty('children.array.data.path', ['array']);
        });
        it('have fields', () => {
          expect(tree).toHaveProperty('children.string.data.isPrimitive', true);
          expect(tree).toHaveProperty('children.number.data.isPrimitive', true);
          expect(tree).toHaveProperty('children.boolean.data.isPrimitive', true);
          expect(tree).toHaveProperty('children.object.data.isPrimitive', true);
          expect(tree).toHaveProperty('children.array.data.isPrimitive', true);
        });
        it('fields have names', () => {
          expect(tree).toHaveProperty('children.string.data.name', 'string');
          expect(tree).toHaveProperty('children.number.data.name', 'number');
          expect(tree).toHaveProperty('children.boolean.data.name', 'boolean');
          expect(tree).toHaveProperty('children.object.data.name', 'object');
          expect(tree).toHaveProperty('children.array.data.name', 'array');
        });
      });
      describe('composed properties', () => {
        class Child {
          name = String;
        }
        class Parent {
          name = String;
          child = Child;
        }
        let tree = Tree.from(Parent);
        it('are present', () => {
          expect(Object.keys(tree.children).length).toBe(2);
          expect(tree.children.child).toHaveProperty('data.path', ['child']);
          expect(tree.children.child).toHaveProperty('data.isPrimitive', false);
          expect(tree.children.child).toHaveProperty('data.isComposed', true);
          expect(tree.children.child).toHaveProperty('data.isParameterized', false);
          expect(tree.children.child).toHaveProperty('data.schemaType', Child);
          expect(tree.children.child).toHaveProperty('data.type', Child);
          expect(tree.children.child.children.name).toHaveProperty('data.isPrimitive', true);
        });
      });
      it('supports circular composed objects', () => {
        class Item {
          item = Item;
        }
        let tree = Tree.from(Item);
        expect(tree.children.item).toBeInstanceOf(Tree);
        expect(tree.children.item.data.type).toBe(Item);
        expect(tree.children.item.children.item).toBeInstanceOf(Tree);
        expect(tree.children.item.children.item.data.type).toBe(Item);
        expect(tree.children.item.children.item.data.path).toEqual(['item', 'item']);
      });
    });
    describe('arrays', () => {
      let tree;
      class Item {
        name = String;
      }
      beforeEach(() => {
        tree = Tree.from([Item]);
      });

      it('supports [<Type>] syntax', () => {
        has(tree, 'data.isComposed', true);
        has(tree, 'data.isPrimitive', false);
        has(tree, 'data.isParameterized', true);
        has(tree, 'data.isList', true);
        has(tree, 'data.properties', undefined);
        has(tree, 'data.schemaType', [Item]);
        has(tree, 'data.type', MicrostateArray);
      });
      it('parameterized types converted to Tree in `of` property', () => {
        expect(tree.data.of[0]).toBeInstanceOf(Tree);
      });
      it('has push transition', () => {
        expect(tree.data.transitions.push).toBeDefined();
      });
    });
  });
  describe('map', () => {
    it('is defined', () => {
      expect(Tree.map).toBeDefined();
    });
    describe('callback', () => {
      let describe_for = Type => {
        let it_received = (property, expected) => {
          it(`is object with ${property} equal to ${expected}`, () => {
            expect(callback).toHaveProperty(`mock.calls.0.0.${property}`, expected);
          });
        };
        let callback;
        describe(`for ${Type.name}`, () => {
          beforeEach(() => {
            callback = jest.fn();
            Tree.map(callback, Tree.from(Type));
          });
          it(`is called once`, () => {
            expect(callback).toHaveBeenCalledTimes(1);
          });
          describe('first argument', () => {
            it_received('isPrimitive', true);
            it_received('name', undefined);
            it('is an object with transitions object as first argument', () => {
              expect(callback.mock.calls[0][0].transitions).toBeInstanceOf(Object);
            });
          });
          describe('second argument', () => {
            it('is an empty array', () => {
              expect(callback.mock.calls[0][1]).toEqual([]);
            });
          });
        });
      };
      describe_for(Number);
      describe_for(String);
      describe_for(Boolean);
      describe_for(Object);
      describe_for(Array);
      describe('for shallow composed state', () => {
        let callback;
        beforeEach(() => {
          callback = jest.fn();
          class Person {
            name = String;
          }
          Tree.map(callback, Tree.from(Person));
        });
        it('is called once', () => {
          expect(callback).toHaveBeenCalledTimes(1);
        });
        describe('first argument', () => {
          it('is an object with isPrimitive equal false', () => {
            expect(callback).toHaveProperty('mock.calls.0.0.isPrimitive', false);
          });
          it('is an object with isComposed equal true', () => {
            expect(callback).toHaveProperty('mock.calls.0.0.isComposed', true);
          });
          it('is has merge transition', () => {
            expect(callback.mock.calls[0][0].transitions.merge).toBeDefined();
          });
        });
        describe('second argument', () => {
          let callback;
          beforeEach(() => {
            callback = jest.fn().mockImplementation(() => {});
            class Person {
              name = String;
              parent = Person;
            }
            let tree = Tree.map(callback, Tree.from(Person));
            tree.parent;
            tree.parent.name;
            tree.parent.parent;
          });
          it('was called three times', () => {
            expect(callback).toHaveBeenCalledTimes(4);
          });
          it('recieved empty array on 1st call', () => {
            expect(callback).toHaveProperty('mock.calls.0.1', []);
          });
          it('received [parent] on 2nd call', () => {
            expect(callback).toHaveProperty('mock.calls.1.1', ['parent']);
          });
          it('received [parent, name] on 3nd call', () => {
            expect(callback).toHaveProperty('mock.calls.2.1', ['parent', 'name']);
          });
          it('received [parent, parent] on 3th call', () => {
            expect(callback).toHaveProperty('mock.calls.3.1', ['parent', 'parent']);
          });
        });
      });
      describe('for parameterized list', () => {
        let callback;
        beforeEach(() => {
          callback = jest.fn();
          Tree.map(callback, Tree.from([String]));
        });
        it('is called once', () => {
          expect(callback).toHaveBeenCalledTimes(1);
        });
        describe('first argument', () => {
          it('is an object with isPrimitive equal false', () => {
            expect(callback).toHaveProperty('mock.calls.0.0.isPrimitive', false);
          });
          it('is an object with isList equal true', () => {
            expect(callback).toHaveProperty('mock.calls.0.0.isList', true);
          });
          it('is an object with isParameterized equal true', () => {
            expect(callback).toHaveProperty('mock.calls.0.0.isParameterized', true);
          });
        });
      });
    });
  });
});
