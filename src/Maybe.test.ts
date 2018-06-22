import { Maybe, Monad, isJust, isNothing, boolToMaybe, match2 } from './Maybe';

describe('Monad laws:', () => {
	describe('A monad', () => {
		class IdentityMonad<A> implements Monad<A> {
			constructor(private readonly value: A) {}
			public bind<B>(f: (v: A) => IdentityMonad<B>): IdentityMonad<B> {
				return f(this.value);
			}

			public static unit<A>(v: A): IdentityMonad<A> {
				return new IdentityMonad<A>(v);
			}
		}

		const x = 'hello';
		const y = 'world';
		const z = '!';
		const f = (_: string) => IdentityMonad.unit(y);
		const g = (_: string) => IdentityMonad.unit(z);

		it('should obey the left-identity law', () => {
			expect(IdentityMonad.unit(x).bind(f)).toEqual(f(x));
		});

		it('should obey the right-identity law', () => {
			const monad = IdentityMonad.unit(x);
			expect(monad.bind(IdentityMonad.unit)).toEqual(monad);
		});

		it('should obey the associativity law', () => {
			const monad = IdentityMonad.unit(x);
			expect(monad.bind(f).bind(g)).toEqual(monad.bind(v => f(v).bind(g)));
		});
	});
});

describe('Maybe monad', () => {
	describe('unit()', () => {
		it('should return Just(string) when called with string', () => {
			const value = 'Hello World';
			const just = Maybe.unit(value);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			just.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).toBeCalledWith(value);
			expect(nothingSpy).not.toBeCalled();
		});

		it('should return Just(Date) when called with Date', () => {
			const value = new Date();
			const just = Maybe.unit(value);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			just.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).toBeCalledWith(value);
			expect(nothingSpy).not.toBeCalled();
		});

		it('should return Just(boolean) when called with false', () => {
			const value = false;
			const just = Maybe.unit(value);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			just.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).toBeCalledWith(value);
			expect(nothingSpy).not.toBeCalled();
		});

		it('should return Just(number) when called with 0', () => {
			const value = 0;
			const just = Maybe.unit(value);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			just.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).toBeCalledWith(value);
			expect(nothingSpy).not.toBeCalled();
		});

		it('should return Nothing() when called with null', () => {
			const nothing = Maybe.unit(null);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			nothing.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(nothingSpy).toBeCalled();
			expect(justSpy).not.toBeCalled();
		});

		it('should return Nothing() when called with undefined', () => {
			const nothing = Maybe.unit(undefined);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			nothing.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(nothingSpy).toBeCalled();
			expect(justSpy).not.toBeCalled();
		});
	});

	describe('bind()', () => {
		it('bind', () => {
			const value = 'Hello World';
			const space = ' ';
			const indexOfSpace = value.indexOf(space);

			const bound = Maybe.unit(value).bind(s => Maybe.unit(s.indexOf(space)));

			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			bound.match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).toBeCalledWith(indexOfSpace);
			expect(nothingSpy).not.toBeCalled();
		});
	});

	describe('map()', () => {
		describe('functor laws', () => {
			it('should obey the identity law (x.map(id) === x)', () => {
				const x = Maybe.unit(13);
				expect(x.map(v => v)).toEqual(x);
			});

			it('should obey the composition law (x.map(x => f(g(x))) === x.map(g).map(f))', () => {
				const x = Maybe.unit(13);
				const f = (n: number) => n + 1;
				const g = (n: number) => n * 2;

				const r1 = x.map(x => f(g(x)));
				const r2 = x.map(g).map(f);
				expect(r1).toEqual(r2);
			});
		});

		it('should transform value by using the given function', () => {
			const value = 'Hello';
			const name = 'Superman';
			const mbValue = Maybe.unit(value);
			const transformed = mbValue
				.map(v => `${v} ${name}`)
				.getOrElse(() => 'nope');
			expect(transformed).toEqual(`${value} ${name}`);
		});

		it('should not invoke given function if Maybe is Nothing', () => {
			const nothing = Maybe.unit(undefined);
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			nothing.map(justSpy).getOrElse(nothingSpy);

			expect(justSpy).not.toBeCalled();
			expect(nothingSpy).toBeCalled();
		});
	});

	describe('all()', () => {
		it('should call given function with values of all Just instances', () => {
			const a = Maybe.unit('a');
			const b = Maybe.unit('b');
			const c = Maybe.unit('c');
			Maybe.all([a, b, c], values => expect(values).toEqual(['a', 'b', 'c']));
		});

		it('should return a Just containing the result of given function', () => {
			const a = Maybe.unit('a');
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			Maybe.all([a, a, a], () => 'hi there!').match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).toBeCalledWith('hi there!');
			expect(nothingSpy).not.toBeCalled();
		});

		it('should return a nothing if at least one given Maybe is not a Just', () => {
			const a = Maybe.unit('a');
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			Maybe.all([a, Maybe.nothing(), a], () => {}).match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(justSpy).not.toBeCalled();
			expect(nothingSpy).toBeCalled();
		});
	});

	describe('liftA2', () => {
		it('should call value function with two values if both are Just', () => {
			const aV = 'a';
			const bV = 15;
			const a = Maybe.unit(aV);
			const b = Maybe.unit(bV);

			const vFSpy = jest.fn();

			Maybe.liftA2(a, b, vFSpy);
			expect(vFSpy).toBeCalledWith(aV, bV);
		});

		it('should not call value function if both are Nothing', () => {
			const vFSpy = jest.fn();
			Maybe.liftA2(Maybe.nothing(), Maybe.nothing(), vFSpy);
			expect(vFSpy).not.toBeCalled();
		});

		it('should not call value function if second Maybe is Nothing', () => {
			const vFSpy = jest.fn();
			Maybe.liftA2(Maybe.unit('a'), Maybe.nothing(), vFSpy);
			expect(vFSpy).not.toBeCalled();
		});
		it('should not call value function if first Maybe is Nothing', () => {
			const vFSpy = jest.fn();
			Maybe.liftA2(Maybe.nothing(), Maybe.unit('a'), vFSpy);
			expect(vFSpy).not.toBeCalled();
		});
	});

	describe('catMaybes()', () => {
		it('should return a list of all Just instances if all Maybes are Justs', () => {
			const a = Maybe.unit('a');
			const b = Maybe.unit('b');
			const c = Maybe.unit('c');
			expect(Maybe.catMaybes([a, b, c])).toEqual(['a', 'b', 'c']);
		});

		it('should return a list of Justs if any of the given Maybes is Nothing', () => {
			const vA = 'a';
			const a = Maybe.unit(vA);
			const vB = 'b';
			const b = Maybe.unit(vB);

			expect(Maybe.catMaybes([a, Maybe.nothing(), b, Maybe.nothing()])).toEqual(
				[vA, vB]
			);
		});
	});

	describe('nothing()', () => {
		it('should return Nothing', () => {
			const justSpy = jest.fn();
			const nothingSpy = jest.fn();

			Maybe.nothing().match({
				Nothing: nothingSpy,
				Just: justSpy
			});
			expect(nothingSpy).toBeCalled();
			expect(justSpy).not.toBeCalled();
		});
	});

	describe('orElse', () => {
		it('should return other Just(v) if Maybe is Nothing', () => {
			const other = Maybe.unit('other');
			expect(Maybe.nothing().orElse(() => other)).toEqual(other);
		});

		it('should return Just(v) if Maybe is Just', () => {
			const v = 'so cool';
			const mbV = Maybe.unit(v);
			const other = Maybe.unit('other');
			expect(mbV.orElse(() => other)).toEqual(mbV);
		});
	});

	describe('orElseS', () => {
		it('should return other Just(v) if Maybe is Nothing', () => {
			const other = Maybe.unit('other');
			expect(Maybe.nothing().orElseS(other)).toEqual(other);
		});

		it('should return Just(v) if Maybe is Just', () => {
			const v = 'so cool';
			const mbV = Maybe.unit(v);
			const other = Maybe.unit('other');
			expect(mbV.orElseS(other)).toEqual(mbV);
		});
	});

	describe('getOrElse', () => {
		it('should return value if Maybe is Just', () => {
			const v = 'so cool';
			const mbV = Maybe.unit(v);
			expect(mbV.getOrElse(() => 'failed')).toEqual(v);
		});

		it('should return other value if Maybe is Nothing', () => {
			const other = 'other';
			expect(Maybe.nothing().getOrElse(() => other)).toEqual(other);
		});
	});

	describe('getOrElseS', () => {
		it('should return value if Maybe is Just', () => {
			const v = 'so cool';
			const mbV = Maybe.unit(v);
			expect(mbV.getOrElseS('failed')).toEqual(v);
		});

		it('should return other value if Maybe is Nothing', () => {
			const other = 'other';
			expect(Maybe.nothing().getOrElseS(other)).toEqual(other);
		});
	});
});

describe('isJust', () => {
	it('should return true if Maybe has a value', () => {
		expect(isJust(Maybe.unit('yay'))).toEqual(true);
	});
	it('should return false if Maybe has no value', () => {
		expect(isJust(Maybe.unit(null))).toEqual(false);
	});
});

describe('isNothing', () => {
	it('should return true if Maybe has no value', () => {
		expect(isNothing(Maybe.nothing())).toEqual(true);
	});
	it('should return false if Maybe has no value', () => {
		expect(isNothing(Maybe.unit(10))).toEqual(false);
	});
});

describe('boolToMaybe', () => {
	it('should return Just(v) if the passed value is truthy', () => {
		const value = true;
		const just = boolToMaybe(value);
		const justSpy = jest.fn();
		const nothingSpy = jest.fn();

		just.match({
			Nothing: nothingSpy,
			Just: justSpy
		});
		expect(justSpy).toBeCalledWith(value);
		expect(nothingSpy).not.toBeCalled();
	});

	it('should return Nothing if the passed value is falsy', () => {
		const nothing = boolToMaybe(false);
		const justSpy = jest.fn();
		const nothingSpy = jest.fn();

		nothing.match({
			Nothing: nothingSpy,
			Just: justSpy
		});
		expect(nothingSpy).toBeCalled();
		expect(justSpy).not.toBeCalled();
	});
});

describe('match2', () => {
	const expectedFirst = 1;
	const expectedSecond = 2;
	const expectedBoth = 3;
	const expectedNeither = 0;

	const first = Maybe.unit(expectedFirst);
	const second = Maybe.unit(expectedSecond);

	const numberMatcher = match2<number, number, number>({
		First: a => a,
		Second: b => b,
		Both: (a, b) => a + b,
		Neither: () => expectedNeither
	});

	it('should return First() if first is Just and second is Nothing', () => {
		expect(numberMatcher(first, Maybe.nothing())).toEqual(expectedFirst);
	});

	it('should return Second() if first is Nothing and second is Just', () => {
		expect(numberMatcher(Maybe.nothing(), second)).toEqual(expectedSecond);
	});

	it('should return Both() if both are Just', () => {
		expect(numberMatcher(first, second)).toEqual(expectedBoth);
	});

	it('should return Neither() if both are Nothing', () => {
		expect(numberMatcher(Maybe.nothing(), Maybe.nothing())).toEqual(
			expectedNeither
		);
	});
});
