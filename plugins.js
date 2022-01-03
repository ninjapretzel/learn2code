// import { TestCase } from "./src/lesson.js"
// import { ExecutionResult } from "./src/vm.js";

/** object descriptor returned by @see {L2CPlugin.judge} if it judges a result. */
class Judgement { 
	/** @type {?boolean} Was this judgement even expected by the respective test? */
	expected = false
	/** @type {?boolean} If the value matched exactly or not, in a pass/fail manner. */
	matched = undefined
	/** @type {?number} Numeric distance, expected to be used when exact matches are not able to be used, but an exact distance measure is available. */
	distance = undefined
	/** @type {?number} Numeric accuracy, expected to be within [ 0, 100 ] when exact matches are not able to be used, and distance measure is not really applicable. */
	accuracy = undefined
}

window.check = function(judge) {
	if (!judge.expected) { return undefined; }
	function has(thing) { return thing !== undefined && thing != null; }
	function count() { 
		let cnt = 0;
		for (let i = 0; i < arguments.length; i++) {
			if (arguments[i]) { cnt++; }
		}
		return cnt;
	}
	// This has to be exhaustive due to the way javascript treats any value as a boolean.
	// Must match exactly, since just doing `judgement.matched` 
	// would also produce false values on undefined/null
	const hasMatched = has(judge.matched);
	const hasDistance = has(judge.distance);
	const hasAccuracy = has(judge.accuracy);
	const present = count(hasMatched, hasDistance, hasAccuracy);
	if (present !== 1) { 
		throw new Error(`Expected only one of matched/distance/accuracy, but had ${present}.`);
	}
	if (hasMatched) {
		if (judge.matched === false) { return false; }
		else if (judge.matched === true) { return true; }
		else { 
			throw new Error(`Unexpected value ${judge.matched} for \`matched\` field of judgement. expected type boolean`);
		}
	} else if (hasDistance) {
		if (typeof(judge.distance) === "number") {
			if (judge.distance < 0) {
				throw new Error(`Unexpected value ${judge.distance} for \`distance\` field of judgement. expected in range [0,infinity]`);
			}
			return judge.distance;
		} else {
			throw new Error(`Unexpected value ${judge.distance} for \`distance\` field of judgement. expected type number`);
		}
	} else if (hasAccuracy) {
		if (typeof(judge.accuracy) === "number") {
			if (judge.accuracy < 0 || judge.accuracy > 100) {
				throw new Error(`Unexpected value ${judge.accuracy} for \`accuracy\` field of judgement. expected in range [0,100]`);
			}
			return judge.accuracy;
		} else {
			throw new Error(`Unexpected value ${judge.accuracy} for \`accuracy\` field of judgement. expected type number`);
		}
	}
}

window.checkMatch = function(plugin, test, res) {
	const judge = plugin.judge(test, res);
	const checked = window.check(judge);
	const id = plugin.id;
	if (typeof(checked) === "boolean") {
		res["matched"+id] = checked;
	} else if (typeof(checked) === "number") {
		if (typeof(judge.distance) === "number") {
			res["distance"+id] = checked;
			const threshold = test["thresholdDistance"+id] || plugin.distanceThreshold;
			res["matched"+id] = judge.distance <= threshold;
		} else if (typeof(judge.accuracy) === "number") {
			res["accuracy"+id] = checked;
			const threshold = test["thresholdAccuracy"+id] || plugin.accuracyThreshold;
			res["matched"+id] = judge.accuracy >= threshold;
		}
	} else {
		console.log("wtf Got bad judgement", judge);	
	}
}

/** Plugin that can be loaded into learn2code to add support for custom code judgement and feedback, or other functionality */
class L2CPlugin {
	
	/** @type {string} Unique ID for this plugin, used to store information related to the plugin*/
	get id() { return "uniqueID"; }
	/** @type {number} Threshold for accuracy for grades. Default = 90. override to change */
	get accuracyThreshold() { return 90; }
	/** @type {number} Threshold for distance for grades. Default = 0. override to change */
	get distanceThreshold() { return 0; }
	
	/** Function to tell if this plugin is expected (used) by a given lesson or TestCase
	 * a lesson is considered expected if it has a truthy property named "expect{id}"
	 * where {id} is the string returned by @see id
	 * @param {Lesson|TestCase} data Lesson or TestCase to check
	 * @returns {boolean} true when expected, false otherwise. */
	isExpected(data) {
		if (data["expect"+this.id]) { return true; }
		if (data.TestCases) {
			for (let test of data.TestCases) {
				if (test["expect"+this.id]) { return true; }	
			}
		}
		return false;
	}
	
	/** Function to judge 
	 * @param {TestCase} test TestCase to judge against
	 * @param {ExecutionResult} result ExecutionResult to judge
	 * @returns {?Judgement} Judgement made, if any is applicable, otherwise either a null/undefined or { expected:false } is expected. */
	judge(test, result) {
		// console.log(this.id, "judging", result, "for", test);
		if (!result) { return false; }
		if (test["expect"+this.id]) {
			return {
				expected: true,
				matched: this.check(test["expected"+this.id], result[this.id])
			}
		}
		return false;
	}
	
	/** Function to extract the plugin's value to check. 
	 * @param {ExecutionResult} result result to check */
	extract(result) { return undefined; }
	
	/** Function to check if expected value matches return value
	 * @param {any} expectedValue expected value
	 * @param {any} resultValue actual value from running test
	 * @returns {number|boolean} Judgement of result vs expected values. */
	check(expectedValue, resultValue) { return expectedValue === resultValue; }
	
	/** Function to decide to draw a chip or not. 
	 * @param {TestCase} test TestCase to decide to draw a chip for
	 * @param {ExecutionResult} result ExecutionResult with respect to test case to make decision for.
	 * @param {Judgement} judgement Judgement of the test and result by the same plugin
	 * @returns {?string} icon name in chip, if one is to be drawn, or undefined/null if no chip is to be drawn */
	chip(test, result, judgement) { return "question_mark"; }
	
	/** Function to decide what classes to decorate result displays with. 
	 * @param {TestCase} test TestCase to decide to draw a chip for
	 * @param {ExecutionResult} result ExecutionResult with respect to test case to make decision for, if applicable.
	 * @param {Judgement} judgement Judgement of the test and result by the same plugin
	 * @returns {?string} classes to append to results display, if any */
	classes(test, result, judgement) { return "neutral"; }
	
	/** Function to draw a panel for the plugin.
	 * @param {Lesson} data lesson data (if needed) in panel
	 * @returns {?ReactDOMElement} Panel to add, if needed, or a falsey value to add nothing */
	panel(data) { return null; }
	
	/** Function called to display a result in the test case card. 
	 * Should return either a  ReactDOMElement, a string, or a falsey value to display nothing  
	 * @param {TestCase} test respective TestCase
	 * @param {any} result result to display. Either is the expected value or the student's result
	 * @returns {?(ReactDOMElement|string)} item to actually display */
	display(test, result) { return <div> Please Override <tt>display(test, result); </tt> </div> }
	
	/** Function called once the given lesson is loaded and the page set up.
	 * @param {Lesson} lesson Lesson object that has been loaded */
	ready(lesson) {}
	
	/** Function to run each time before code is executed
	 * @param {TestCase} test test case 
	 * @param {ExecutionResult} result result to check */
	preRun(test, injected, result) { }
	
	/** Function to run each time after code is executed
	 * @param {TestCase} test test case 
	 * @param {ExecutionResult} result result to check */
	postRun(test, injected, result) { }
	
	
}

function pretty(thing) {
	let str = JSON.stringify(thing);
	if (str === undefined) { str = "undefined"; }
	if (str === null) { str = "null"; }
	if (str === "") { str = "(Empty String)"; }	
	return str;
}

/** Both a sample plugin, and the plugin for handling return values. */
class ReturnValuePlugin extends L2CPlugin {
	get id() { return "ReturnValue"; }
	extract(result) { return result.returned; }
	
	chip(test, result, judgement) { 
		return judgement.expected ? "keyboard_return" : null; 
	}
	
	classes(test, result, judgement) {
		if (judgement && judgement.expected) { 
			return judgement.matched ? "success" : "failure"; 
		}
		return "neutral";
	}
	
	display(test, result) { return pretty(result); }
	
	preRun(test, injected, result) { }
	postRun(test, injected, result) { }
	
}

function SimConsole() {
	this.buffer = "";
	this.print = (thing) => { this.buffer += thing; console.log("print(): got\""+thing+"\"=>\n"+this.buffer); }
	this.println = (thing) => { this.buffer += thing + "\n"; }
	this.clear = () => { this.buffer = ""; }
}

class ConsoleOutputPlugin extends L2CPlugin {

	get id() { return "ConsoleOutput"; }
	extract(result) { return this.simConsole.buffer; }
	
	// judge(test, result) {
	// 	if (!result) { return false; }
	// 	if (test["expect"+this.id]) {
	// 		return {
	// 			expected: true,
	// 			matched: this.check(test["expected"+this.id], result[this.id])
	// 		}
	// 	}
	// 	return false;
	// }
	
	
	chip(test, result, judgement) { 
		return judgement.expected ? "print" : null; 
	}
	
	classes(test, result, judgement) {
		if (judgement && judgement.expected) { 
			return judgement.matched ? "success" : "failure"; 
		}
		return "neutral";
	}
	display(test, result) { return pretty(result); }
	preRun(test, injected, result) {
		if (!this.simConsole) { this.simConsole = new SimConsole(); }
		this.simConsole.clear();
		injected.print = this.simConsole.print;
		injected.println = this.simConsole.println;
		injected.console = { log: this.simConsole.println };
	}
	
	postRun(test, injected, result) { }
}


/** @type {Map<string, L2CPlugin>} plugins provided for learn2code */
const PLUGINS = {};
function registerPlugin(plugin) {
	PLUGINS[plugin.id] = plugin;
}
registerPlugin(new ReturnValuePlugin());
registerPlugin(new ConsoleOutputPlugin());
