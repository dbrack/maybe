// https://wiki.haskell.org/Monad_laws
export interface Monad<A> {
	bind<B>(f: (v: A) => Monad<B>): Monad<B>;
}

export interface MaybePattern<A, T> {
	Nothing: () => T;
	Just: (v: A) => T;
}

export interface MaybeMatcher<A> {
	match<T>(p: MaybePattern<A, T>): T;
}

export abstract class MaybeM<A> implements Monad<A>, MaybeMatcher<A> {
	// chain together Maybes
	public abstract bind<B>(f: (v: A) => Maybe<B>): Maybe<B>;

	// pattern match Maybes
	public abstract match<T>(p: MaybePattern<A, T>): T;

	// functor
	public abstract map<B>(f: (v: A) => B): Maybe<B>;

	// get/unwrap the actual value out of a Maybe
	public abstract getOrElse(f: () => A): A;
	public abstract getOrElseS(v: A): A;

	public abstract orElse(o: () => Maybe<A>): Maybe<A>;
	public abstract orElseS(o: Maybe<A>): Maybe<A>;
}

export type Maybe<A> = MaybeM<A>;
export namespace Maybe {
	// wrap a value inside a Maybe
	export function unit<A>(v: A): Maybe<A> {
		return v == undefined ? new Nothing() : new Just<A>(v);
	}

	export function nothing<A>(): Maybe<A> {
		return new Nothing();
	}

	// returns Nothing if any of the Maybes is Nothing
	export function all<T, R>(xs: Maybe<T>[], f: (v: T[]) => R): Maybe<R> {
		return xs
			.reduce(
				(acc, mb) => mb.bind(v => acc.bind(x => unit([...x, v]))),
				unit<T[]>([])
			)
			.bind(v => unit(f(v)));
	}

	// applicative, returns Nothing if either of the two Maybes is Nothing
	// Lift two Maybe's. Use this if the two Maybe's are of different types.
	// If all Maybe's are of the same type, use all().
	export function liftA2<A, B, R>(
		a: Maybe<A>,
		b: Maybe<B>,
		f: (a: A, b: B) => R
	): Maybe<R> {
		return a.bind(va => b.bind(vb => unit(f(va, vb))));
	}

	// takes a list of Maybes and returns a list of all the Just values.
	export function catMaybes<T>(xs: Maybe<T>[]): T[] {
		return xs.reduce(
			(acc, m) =>
				m.match({
					Nothing: () => acc,
					Just: v => [...acc, v]
				}),
			[]
		);
	}
}

class Just<A> extends MaybeM<A> {
	constructor(private readonly value: A) {
		super();
	}

	public bind<B>(f: (v: A) => Maybe<B>): Maybe<B> {
		return f(this.value);
	}

	public orElse(o: () => Maybe<A>): Maybe<A> {
		return this;
	}

	public orElseS(o: Maybe<A>): Maybe<A> {
		return this;
	}

	public getOrElse(f: () => A): A {
		return this.value;
	}

	public getOrElseS(v: A): A {
		return this.value;
	}

	public match<T>(p: MaybePattern<A, T>): T {
		return p.Just(this.value);
	}

	public map<B>(f: (v: A) => B): Maybe<B> {
		return new Just(f(this.value));
	}
}

class Nothing extends MaybeM<never> {
	public bind(f: (_: never) => Nothing): Maybe<never> {
		return new Nothing();
	}

	public orElse(o: () => Maybe<never>): Maybe<never> {
		return o();
	}

	public orElseS(o: Maybe<never>): Maybe<never> {
		return o;
	}

	public getOrElse(f: () => never): never {
		return f();
	}

	public getOrElseS(v: never): never {
		return v;
	}

	public match<T>(p: MaybePattern<never, T>): T {
		return p.Nothing();
	}

	public map<B>(f: (v: never) => B): Maybe<never> {
		return new Nothing();
	}
}

export function isJust<T>(x: Maybe<T>): boolean {
	return x.match({
		Just: v => true,
		Nothing: () => false
	});
}

export function isNothing<T>(x: Maybe<T>): boolean {
	return !isJust(x);
}

// This function is useful to bind (chain) values only when a given condition is true.
// Basically saves if/else statements and uses functions instead
// > boolToMaybe(true).bind(() => { ... });
// > boolToMaybe(true).map(() => { ... });
export function boolToMaybe(x: boolean): Maybe<boolean> {
	return x ? Maybe.unit(x) : Maybe.nothing();
}

// match2
export interface Maybe2Pattern<A, B, T> {
	First: (a: A) => T;
	Second: (b: B) => T;
	Both: (a: A, b: B) => T;
	Neither: () => T;
}

export function match2<A, B, T>(pattern: Maybe2Pattern<A, B, T>) {
	return (a: Maybe<A>, b: Maybe<B>) => {
		return Maybe.liftA2(a, b, pattern.Both)
			.orElse(() => a.map(pattern.First))
			.orElse(() => b.map(pattern.Second))
			.getOrElse(pattern.Neither);
	};
}
