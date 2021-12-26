// import { TestCase } from "./src/lesson.js"
// import { ExecutionResult } from "./src/vm.js";

/** object descriptor returned by @see {L2CPlugin.judge} if it judges a result. */
class Judgement { 
	/** @type {?boolean} Was this judgement even expected by the respective test? */
	expected = false
	/** @type {?boolean} If the value matched exactly or not, in a pass/fail manner. */
	matched = false
	/** @type {?number} Numeric distance, expected to be used when exact matches are not able to be used, but an exact distance measure is available. */
	distance = 0
	/** @type {?number} Numeric accuracy, expected to be within [ 0, 100 ] when exact matches are not able to be used, and distance measure is not really applicable. */
	accuracy = 0
}



/** Plugin that can be loaded into learn2code to add support for custom code judgement and feedback, or other functionality */
class L2CPlugin {
	
	/** @type {string} Unique ID for this plugin, used to store information related to the plugin*/
	get id() { return "uniqueID"; } 
	
	/** Function to judge 
	 * @param {TestCase} test TestCase to judge against
	 * @param {ExecutionResult} result ExecutionResult to judge
	 * @returns {?Judgement} Judgement made, if any is applicable, otherwise either a null/undefined or { expected:false } is expected. */
	judge(test, result) {
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
	 * @returns {?ReactDOMElement} Item to append to DOM for test case, otherwise a null/undefined is expected. */
	check(expectedValue, resultValue) { return expectedValue === resultValue; }
	
	/** Function to append visuals for a given test case/result 
	 * @param {TestCase} test TestCase to draw
	 * @param {ExecutionResult} result ExecutionResult to draw
	 * @returns {?ReactDOMElement} Item to append to DOM for test case, otherwise a null/undefined is expected. */
	draw(test, result) {
		let text = "Expected " + this.id + " " 
			+ JSON.stringify(test[expected+this.id]) 
			+ " got " 
			+ JSON.stringify(result[this.id] ?? "<NULLPTR>");
		return <span> {text} </span>
	}
	
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
	
	
	/** Function to run each time before code is executed
	 * @param {TestCase} test test case 
	 * @param {ExecutionResult} result result to check */
	preRun(test, injected, result) { }
	postRun(test, injected, result) { }
	
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
	
	chip(test, result, judgement) { 
		return judgement.expected ? "print" : null; 
	}
	
	classes(test, result, judgement) {
		if (judgement && judgement.expected) { 
			return judgement.matched ? "success" : "failure"; 
		}
		return "neutral";
	}
	preRun(test, injected, result) {
		if (!this.simConsole) { this.simConsole = new SimConsole(); }
		this.simConsole.clear();
		injected.print = this.simConsole.print;
		injected.println = this.simConsole.println;
		injected.console = { log: this.simConsole.println };
	}
	
	postRun(test, injected, result) {
		console.log(this.id, "postrun");
	}
}

/** @type {Map<string, L2CPlugin>} plugins provided for learn2code */
const PLUGINS = {};
function registerPlugin(plugin) {
	PLUGINS[plugin.id] = plugin;
}
registerPlugin(new ReturnValuePlugin());
registerPlugin(new ConsoleOutputPlugin());
