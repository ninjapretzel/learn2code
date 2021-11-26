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
	judge(test, result) {}
	
	/** Function to append visuals for a given test case/result 
	 * @param {TestCase} test TestCase to draw
	 * @param {ExecutionResult} result ExecutionResult to draw
	 * @returns {?ReactDOMElement} Item to append to DOM for test case, otherwise a null/undefined is expected. */
	draw(test, result) { return <div> Sample test </div> }
	
	/** Function to decide to draw a chip or not. 
	 * @param {TestCase} test TestCase to decide to draw a chip for
	 * @param {ExecutionResult} result ExecutionResult with respect to test case to make decision for.
	 * @param {Judgement} judgement Judgement of the test and result by the same plugin
	 * @returns {?string} icon name in chip, if one is to be drawn, or undefined/null if no chip is to be drawn */
	chip(test, result, judgement) { }
	
	/** Function to decide what classes to decorate result displays with. 
	 * @param {TestCase} test TestCase to decide to draw a chip for
	 * @param {ExecutionResult} result ExecutionResult with respect to test case to make decision for, if applicable.
	 * @param {Judgement} judgement Judgement of the test and result by the same plugin
	 * @returns {?string} classes to append to results display, if any */
	classes(test, result, judgement) { }
	
}

/** Both a sample plugin, and the plugin for handling return values. */
class ReturnValuePlugin extends L2CPlugin {
	get id() { return "ReturnValue"; }
	judge(test, result) {
		if (test.expectedReturnValue) {
			return {
				expected: true,
				matched: result.returnValue === test.expected	
			}
		}
		return null;
	}
	draw(test, result) {
		let text = "Expected " + JSON.stringify(test.expected) + " got " + JSON.stringify(result.expected ?? "<NULLPTR>");
		return <span> {text} </span>	
	}
	
	chip(test, result, judgement) { return test.expectedReturnValue ? "keyboard_return" : null; }
	
	classes(test, result, judgement) {
		if (judgement && judgement.expected) { return judgement.matched ? "success" : "failure"; }
		return "neutral";
	}
	
}

/** @type {Map<string, L2CPlugin>} plugins provided for learn2code */
const PLUGINS = {};
function registerPlugin(plugin) {
	PLUGINS[plugin.id] = plugin;	
}
registerPlugin(new ReturnValuePlugin());
