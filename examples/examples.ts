import { boolToMaybe, isJust, isNothing, match2, Maybe } from '../src/Maybe';

console.log(isJust(Maybe.unit('isJust')));
console.log(isNothing(Maybe.unit(null)));
console.log(isNothing(Maybe.unit(undefined)));

// boolToMaybe
const doSomething = true;

boolToMaybe(doSomething).map(() =>
	console.log('this is only logged when "doSomething" is truthy')
);
boolToMaybe(doSomething)
	.bind(() => Maybe.unit('this is great'))
	.map(message => console.log(`this will log 'this is great': ${message}`));

boolToMaybe(false).map(() => console.log('this wont be logged'));
boolToMaybe(doSomething)
	.bind(() => Maybe.nothing())
	.map(message =>
		console.log('this wont be logged because bound maybe is Nothing')
	);

// match2
const currentCcy = Maybe.unit('CHF');
const selectedCcy = Maybe.unit('USD');
const valueChanged = match2({
	First: a => true,
	Second: b => true,
	Both: (a, b) => a !== b,
	Neither: () => false
})(currentCcy, selectedCcy);
console.log('currency changed:', valueChanged); // true
