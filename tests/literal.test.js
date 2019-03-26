/* global describe, it */
import expect from 'expect';
import literal from '../src/literal';
import { valueOf } from '../src/meta';

describe('Literal Syntax', function() {
  it('can create numbers', function() {
    expect(literal(5).increment().state).toEqual(6);
  });

  it('can create strings', function() {
    expect(literal('hello').concat(' goodbye').state).toEqual('hello goodbye');
  });

  it('can create booleans', function() {
    expect(literal(true).toggle().state).toEqual(false);
  });

  it('can create objects', function() {
    expect(valueOf(literal({}).put('hello', 'world'))).toEqual({hello: 'world'});
  });

  it('can create nulls', function() {
    expect(valueOf(literal(null))).toEqual(null);
  });

  it('can create arrays', function() {
    expect(valueOf(literal([]).push('hello').push('world'))).toEqual(['hello', 'world']);
  });

  it('understands deeply nested objects and arrays', function() {
    let blob = literal({array: [5, { bool: true }], string: "hi", object: {object: {}}});
    let [ first] = blob.entries.array;
    let [ _, second ] = first.increment().entries.array; // eslint-disable-line no-unused-vars

    let ms = second.entries.bool.toggle()
      .entries.string.concat(" mom")
      .entries.object.put('another', 'property')
      .entries.object.entries.object.put('deep', 'state');

    expect(valueOf(ms)).toEqual({
      array: [6, { bool: false }],
      string: "hi mom",
      object: {
        another: 'property',
        object: {
          deep: 'state'
        }
      }
    });
  });
});
