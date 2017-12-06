import 'jest';

import microstate, * as MS from '../src';

describe('microstate', () => {
  it('throws an error when a transition called state is defined', () => {
    expect(function() {
      microstate(
        class MyClass {
          state() {}
        }
      );
    }).toThrowError(
      `You can not use 'state' as transition name because it'll conflict with state property on the microstate.`
    );
  });
  it('throws an error when state property is set', () => {
    expect(function() {
      microstate(MS.Number).state = 10;
    }).toThrowError(`Setting state property will not do anything useful. Please don't do this.`);
  });
  describe('for Number', () => {
    describe('without initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(MS.Number);
      });
      it('has state', () => {
        expect(ms.state).toBe(0);
      });
      it('has transitions', () => {
        expect(ms).toMatchObject({
          set: expect.any(Function),
          increment: expect.any(Function),
        });
      });
      it('returns new state on transition', () => {
        expect(ms.increment().valueOf()).toBe(1);
      });
    });
    describe('with initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(MS.Number, 3);
      });
      it('returns new state on transition', () => {
        expect(ms.increment().valueOf()).toBe(4);
      });
    });
  });
  describe('for shallow composition', () => {
    class State {
      name = MS.String;
      isOpen = MS.Boolean;
    }
    describe('without initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State);
      });
      it('is instance of State', () => {
        expect(ms.state).toBeInstanceOf(State);
      });
      it('initializes default', () => {
        expect(ms.state).toEqual({ name: '', isOpen: false });
      });
      it('has transitions', () => {
        expect(ms).toMatchObject({
          set: expect.any(Function),
          merge: expect.any(Function),
          name: {
            set: expect.any(Function),
            concat: expect.any(Function),
          },
          isOpen: {
            set: expect.any(Function),
            toggle: expect.any(Function),
          },
        });
      });
      it('replaces value when set is called on the node', () => {
        expect(ms.set({ name: 'taras' }).valueOf()).toEqual({ name: 'taras' });
      });
      it('replaces value when set is called on leaf state', () => {
        expect(ms.name.set('taras').valueOf()).toEqual({ name: 'taras' });
      });
    });
    describe('with initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State, { isOpen: true });
      });
      it('uses provided state', () => {
        expect(ms.state).toEqual({ name: '', isOpen: true });
      });
      it('replaces value when set is called but uses provided value', () => {
        expect(ms.name.set('taras').valueOf()).toEqual({ name: 'taras', isOpen: true });
      });
      it('merges value on merge transition', () => {
        expect(ms.merge({ name: 'taras' }).valueOf()).toEqual({ name: 'taras', isOpen: true });
      });
    });
  });
  describe('shallow composition with arrays and objects', () => {
    class State {
      animals = MS.Array;
      config = MS.Object;
    }
    describe('without initial value', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State);
      });
      it('initialies with default', () => {
        expect(ms.state).toEqual({
          animals: [],
          config: {},
        });
      });
      it('returns a new object with value pushed into an array', () => {
        expect(ms.animals.push('cat').valueOf()).toEqual({
          animals: ['cat'],
        });
      });
      it('return a new object with value assigned into the object', () => {
        expect(ms.config.assign({ x: 10, y: 20 }).valueOf()).toEqual({
          config: { x: 10, y: 20 },
        });
      });
    });
    describe('with initial value', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State, { animals: ['cat', 'dog'], config: { color: 'red' } });
      });
      it('uses provided value', () => {
        expect(ms.state).toEqual({
          animals: ['cat', 'dog'],
          config: { color: 'red' },
        });
      });
      it('returns a new object with value pushed into an array', () => {
        expect(ms.animals.push('bird').valueOf()).toEqual({
          animals: ['cat', 'dog', 'bird'],
          config: { color: 'red' },
        });
      });
      it('return a new object with value assigned into the object', () => {
        expect(ms.config.assign({ x: 10, y: 20 }).valueOf()).toEqual({
          animals: ['cat', 'dog'],
          config: { x: 10, y: 20, color: 'red' },
        });
      });
    });
  });
  describe('recursive composition', () => {
    class Container {
      contains = Container;
      x = MS.Number;
      y = MS.Number;
    }
    describe('without initial value', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(Container);
      });
      it('initializes first level', () => {
        expect(ms.state).toMatchObject({
          contains: expect.any(Object),
          x: 0,
          y: 0,
        });
      });
      it('initializes recursively', () => {
        expect(ms.state).toMatchObject({
          contains: {
            x: 0,
            y: 0,
            contains: expect.any(Object),
          },
          x: 0,
          y: 0,
        });
      });
      it('transitions non recursive value', () => {
        expect(ms.x.increment().valueOf()).toEqual({
          x: 1,
        });
      });
      it('transition recursive value', () => {
        expect(ms.contains.y.increment().valueOf()).toEqual({
          contains: {
            y: 1,
          },
        });
      });
    });
    describe('with initial value', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(Container, {
          x: 10,
          y: 0,
          contains: { y: 20, x: 0, contains: { x: 30, y: 25, contains: {} } },
        });
      });
      it('restores state tree from initial value', () => {
        expect(ms.state).toMatchObject({
          x: 10,
          y: 0,
          contains: {
            y: 20,
            x: 0,
            contains: {
              x: 30,
              y: 25,
            },
          },
        });
      });
      it('transitions deeply nested state', () => {
        expect(ms.contains.contains.x.increment().valueOf()).toEqual({
          x: 10,
          y: 0,
          contains: { y: 20, contains: { x: 31, y: 25, contains: {} }, x: 0 },
        });
      });
      it('transitions deeply nested state without initial value', () => {
        expect(ms.contains.contains.contains.y.decrement().valueOf()).toEqual({
          x: 10,
          y: 0,
          contains: {
            y: 20,
            x: 0,
            contains: { x: 30, y: 25, contains: { y: -1 } },
          },
        });
      });
    });
  });
  describe('deep composition', () => {
    class Session {
      token = MS.String;
    }
    class Authentication {
      isAuthenticated = MS.Boolean;
      session = Session;
    }
    class State {
      authentication = Authentication;
    }
    describe('without initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State);
      });
      it('builds state tree', () => {
        expect(ms.state).toMatchObject({
          authentication: {
            session: {
              token: '',
            },
          },
        });
      });
      it('transitions deeply nested state', () => {
        expect(ms.authentication.session.token.set('SECRET').valueOf()).toEqual({
          authentication: {
            session: { token: 'SECRET' },
          },
        });
      });
    });
    describe('with initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State, {
          authentication: { isAuthenticated: true, session: { token: 'SECRET' } },
        });
      });
      it('builds state tree', () => {
        expect(ms.state).toMatchObject({
          authentication: {
            isAuthenticated: true,
            session: {
              token: 'SECRET',
            },
          },
        });
      });
    });
  });
  describe('custom transitions', () => {
    class Car {
      speed = MS.Number;
      increaseSpeed(current, amount) {
        return this().speed.sum(amount);
      }
    }
    class State {
      vehicle = Car;
    }
    describe('transition', () => {
      describe('without initial value', () => {
        let ms;
        beforeEach(() => {
          ms = microstate(State);
        });
        it('uses current state value', () => {
          expect(ms.vehicle.increaseSpeed(10).valueOf()).toEqual({ vehicle: { speed: 10 } });
        });
      });
      describe('with initial value', () => {
        let ms;
        beforeEach(() => {
          ms = microstate(State, { vehicle: { speed: 10 } });
        });
        it('creates initial value', () => {
          expect(ms.vehicle.increaseSpeed(10).valueOf()).toEqual({ vehicle: { speed: 20 } });
        });
      });
    });
    describe('context', () => {
      let context;
      let result;
      beforeEach(() => {
        class State {
          items = MS.Array;
          custom() {
            context = this;
          }
        }
        let { custom } = microstate(State);
        custom();
      });
      it('is a function', () => {
        expect(context).toBeInstanceOf(Function);
      });
      it.skip('excludes custom transtions from context', () => {
        expect(context()).not.toHaveProperty('custom');
      });
      it('returns transitions', () => {
        expect(context()).toMatchObject({
          items: {
            push: expect.any(Function),
          },
          merge: expect.any(Function),
          set: expect.any(Function),
        });
      });
    });
    describe('type shifting', () => {
      describe('of root state', () => {
        class Choice {
          topic = MS.String;
          yes(current, reason) {
            return this(Yes).affirmation.set(reason);
          }
          no(current, reason) {
            return this(No).refutation.set(reason);
          }
        }
        class No extends Choice {
          refutation = MS.String;
        }
        class Yes extends Choice {
          affirmation = MS.String;
        }
        let ms, yes, no;
        beforeEach(() => {
          ms = microstate(Choice, { topic: 'Microstates are tiny' });
          yes = ms.yes('So tiny.');
          no = ms.no('They huge.');
        });
        it('returns affirmation for yes', () => {
          expect(yes.valueOf()).toEqual({ topic: 'Microstates are tiny', affirmation: 'So tiny.' });
        });
        it('returns refutation for no', () => {
          expect(no.valueOf()).toEqual({ topic: 'Microstates are tiny', refutation: 'They huge.' });
        });
        it(`changed the root's structure`, () => {
          expect(yes.state).toMatchObject({
            topic: 'Microstates are tiny',
            affirmation: 'So tiny.',
          });
        });
      });
      describe('shallow nested property', () => {
        class Filled {
          content = MS.Array;
          empty() {
            return this(Empty);
          }
        }
        class Empty {
          add(current, ...args) {
            return this(Filled).content.push(...args);
          }
        }
        class Box {
          content = Empty;
        }
        let empty, filled, emptied;
        beforeEach(() => {
          empty = microstate(Box);
          filled = empty.content.add('shoes', 'watch');
          emptied = filled.content.empty();
        });
        it('can be empty', () => {
          expect(empty.state).toMatchObject({
            content: expect.any(Empty),
          });
        });
        it('can be filled', () => {
          expect(filled.state).toMatchObject({
            content: expect.any(Filled),
          });
          expect(filled.valueOf()).toEqual({ content: { content: ['shoes', 'watch'] } });
        });
        it('can be emptied', () => {
          expect(emptied.state).toMatchObject({
            content: {},
          });
          expect(emptied.valueOf()).toEqual({ content: {} });
        });
      });
    });
    describe('merging', () => {
      class ModalContent {
        text = MS.String;
      }
      class Modal {
        isOpen = MS.Boolean;
        title = MS.String;
        content = ModalContent;
      }
      class State {
        messages = MS.Array;
        modal = Modal;

        addItemAndShowModal(current, message, prompt) {
          return this()
            .messages.push(message)
            .modal.isOpen.set(true)
            .modal.content.text.set(prompt);
        }
      }
      let ms;
      let result;
      beforeEach(() => {
        ms = microstate(State, { modal: { title: 'Confirmation' } });
        result = ms.addItemAndShowModal('Hello World', 'You have a message');
      });
      it('returns merged state', () => {
        expect(result.valueOf()).toEqual({
          messages: ['Hello World'],
          modal: {
            isOpen: true,
            title: 'Confirmation',
            content: {
              text: 'You have a message',
            },
          },
        });
      });
    });
  });
  describe('computed properties support', () => {
    class State {
      firstName = MS.String;
      lastName = MS.String;
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
    describe('without initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State);
      });
      it('is computed', function() {
        expect(ms.state).toMatchObject({
          fullName: ' ',
        });
      });
    });
    describe('with initial state', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(State, { firstName: 'Peter', lastName: 'Griffin' });
      });
      it('is computed', () => {
        expect(ms.state).toMatchObject({
          fullName: 'Peter Griffin',
        });
      });
    });
  });
  describe('cart example', () => {
    class Cart {
      products = MS.Array;
      get price() {
        return this.products.reduce((acc, product) => acc + product.quantity * product.price, 0);
      }
      get count() {
        return this.products.reduce((acc, product) => acc + product.quantity, 0);
      }
    }
    describe('adding products without initial value', () => {
      let ms;
      beforeEach(() => {
        ms = microstate(Cart)
          .products.push({ quantity: 1, price: 10 })
          .products.push({ quantity: 2, price: 20 });
      });
      it('adds items to the cart', () => {
        expect(ms.state).toMatchObject({
          price: 50,
          count: 3,
          products: [{ quantity: 1, price: 10 }, { quantity: 2, price: 20 }],
        });
      });
      it('provides valueOf', () => {
        expect(ms.valueOf()).toEqual({
          products: [{ quantity: 1, price: 10 }, { quantity: 2, price: 20 }],
        });
      });
    });
  });
  describe('valueOf', () => {
    let ms;
    beforeEach(() => {
      ms = microstate(MS.Number, 10);
    });
    it('returns passed in value of', () => {
      expect(ms.valueOf()).toBe(10);
    });
    it('is not enumerable', () => {
      expect(ms).not.toHaveProperty('valueOf');
    });
  });
  describe('constants support', () => {
    class Type {
      n = 10;
      b = true;
      s = 'hello';
      o = { hello: 'world' };
      a = ['a', 'b', 'c'];
      null = null;
      greeting = MS.String;
    }
    let ms = microstate(Type);
    let next = ms.greeting.set('HI');
    it('includes constants in state tree', () => {
      // once transition-context is merged, need to add collapsed to
      // the end of state().
      expect(ms.state).toEqual({
        n: 10,
        b: true,
        s: 'hello',
        o: { hello: 'world' },
        a: ['a', 'b', 'c'],
        null: null,
        greeting: '',
      });
    });
    it('constants are not included in valueOf', () => {
      expect(ms.valueOf()).toBeUndefined();
    });
    it('next state has constants', () => {
      expect(next.state).toEqual({
        n: 10,
        b: true,
        s: 'hello',
        o: { hello: 'world' },
        a: ['a', 'b', 'c'],
        null: null,
        greeting: 'HI',
      });
    });
    it('next valueOf excludes constants', () => {
      expect(next.valueOf()).toEqual({ greeting: 'HI' });
    });
    it('shares complex objects between multiple instances of microstate', () => {
      expect(ms.state.o).toBe(microstate(Type).state.o);
    });
  });
  describe('type-shifting', () => {
    class Line {
      a = MS.Number;
      add({ a }, b) {
        return this(Corner, { a, b });
      }
    }
    class Corner extends Line {
      a = MS.Number;
      b = MS.Number;
      add({ a, b }, c) {
        return this(Triangle, { a, b, c });
      }
    }
    class Triangle extends Corner {
      c = MS.Number;
    }
    let line = microstate(Line).a.set(10);
    let corner = line.add(20);
    let triangle = corner.add(30);
    it('constructs a line', () => {
      expect(line.state).toBeInstanceOf(Line);
      expect(line.state).toMatchObject({
        a: 10,
      });
      expect(line.valueOf()).toEqual({ a: 10 });
    });
    it('constructs a Corner', () => {
      expect(corner.state).toBeInstanceOf(Corner);
      expect(corner.state).toMatchObject({
        a: 10,
        b: 20,
      });
      expect(corner.valueOf()).toEqual({ a: 10, b: 20 });
    });
    it('constructs a Triangle', () => {
      expect(triangle.state).toBeInstanceOf(Triangle);
      expect(triangle.state).toMatchObject({
        a: 10,
        b: 20,
        c: 30,
      });
      expect(triangle.valueOf()).toEqual({ a: 10, b: 20, c: 30 });
    });
  });
  describe('type-shifting + constant values', () => {
    class Async {
      content = null;
      isLoaded = false;
      isLoading = false;
      isError = false;

      loading() {
        return this(AsyncLoading);
      }
    }

    class AsyncError extends Async {
      isError = true;
      isLoading = false;
      isLoaded = true;
    }

    class AsyncLoading extends Async {
      isLoading = true;

      loaded(current, content) {
        return this(
          class extends AsyncLoaded {
            content = content;
          }
        );
      }

      error(current, msg) {
        return this(
          class extends AsyncError {
            error = msg;
          }
        );
      }
    }

    class AsyncLoaded extends Async {
      isLoaded = true;
      isLoading = false;
      isError = false;
    }
    describe('successful loading siquence', () => {
      let async = microstate(Async);
      it('can transition to loading', () => {
        expect(async.loading().state).toMatchObject({
          content: null,
          isLoaded: false,
          isLoading: true,
          isError: false,
        });
      });
      it('can transition from loading to loaded', () => {
        expect(async.loading().loaded('GREAT SUCCESS').state).toMatchObject({
          content: 'GREAT SUCCESS',
          isLoaded: true,
          isLoading: false,
          isError: false,
        });
      });
    });
    describe('error loading sequence', () => {
      let async = microstate(Async);
      it('can transition from loading to error', () => {
        expect(async.loading().error(':(').state).toMatchObject({
          content: null,
          isLoaded: true,
          isError: true,
          isLoading: false,
          error: ':(',
        });
      });
    });
  });
});
