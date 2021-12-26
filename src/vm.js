/// File holding generic (language-agnostic) virtual machine functionality.
import { Lesson, TestCase } from "./lesson.js";

let delay = 1;
let running = false;
let runId = 0;
let runTask = null;
const INTERRUPTED = "INTERRUPTED";

/**
 * @callback execFn Function to execute code in some given virtual machine
 * @param {string} code Code to execute 
 * @param {Map<string, any} injected namespace to inject 
 * @return {Promise<any>} promise representing execution */

/**
 * @callback extractFn Function to extract the return value of the execution
 * @return {any} value returned from execution */

/** 
 * @callback argsFormatterFn Function to format args in assignment statement for language
 * @param {any} args Args to format
 * @returns {string} args formatted in string, in format for the given language */

/** 
 * @callback errorHandlerFn
 * @param {CodeMirror} scriptEntry code editor object
 * @param {any[]} errors Errors from execution (dependent on language's vm)
 * @return {any} nothing is expected, but side effect should be editor is highlighted to show errors to the student */

/** Class holding information about a language's VM*/
export class VmInfo {
	/** @type {string} syntax highlighting mode name */
	mode = "javascript"
	/** @type {boolean} true when the VM is ready to be used, false otherwise.  */
	ready = true
	/** @type {execFn} Code execution function */
	exec = async function(code, injected) { }
	/** @type {extractFn} Return value extraction function */
	extract = async function() { return undefined }
	/** @type {argsFormatterFn} Function that processes args for the language */
	argsFormatter = function(args) { return "const args = " + JSON.stringify(args); }
	/** @type {errorHandlerFn} Function that processes errors for the language. */
	onError = function(scriptEntry, errors) { }
}

/** Class holding the results of execution of a single `TestCase` */
export class ExecutionResult {
	/** @type {number} Elapsed time to run in ms */
	elapsedMS = 0
	/** @type {any} value returned from execution */
	returnVal = undefined
	/** @type {string} console output from execution */
	consoleOutput = ""
	/** @type {boolean} did the return value match the expected return value? */
	matchedReturnValue = true
	/** @type {boolean} did the console output  match the expected console output? */
	matchedConsoleOutput = true
	/** @type {TestCase} Source Test Case */
	testCase = null
}

/** Type for simulating console output */
export function SimConsole() {
	this.buffer = "";
	this.print = (thing) => { this.buffer += thing; }
	this.println = (thing) => { this.buffer += thing + "\n"; }
	this.clear = () => { this.buffer = ""; }
}
/** Promise wrapper to run code after a delay */
export function wait(ms) {
	return new Promise((resolve, reject) => { setTimeout( ()=>{resolve(); }, ms); });
}
/** directly async version of 'wait' */
export async function pause(ms) { await wait(ms); }

/** Reference to simulated console */
export const simConsole = new SimConsole();
/** Reference to namespace that is injected every run */
export const injected = {
	print: simConsole.print,
	println: simConsole.println,
	console: { log: simConsole.println },
};

/** Internal exection function 
 * @param {string} script user code to execute
 * @param {Lesson} lesson lesson to execute
 * @param {VmInfo} langInfo language specific VM information
 * @returns {ExecutionResult[]} Results of execution of all of the `TestCase`s in the `Lesson` */
export async function execInternal(script, lesson, langInfo) {
	const results = [];
	running = true;
	runId = interp.runId;
	
	const testCode = lesson.TestCode;
	for (let i = 0; i < lesson.TestCases.length; i++) {
		const test = lesson.TestCases[i];
		
		const args = test.args;
		const expected = {};
		const injected = {};
		
		//const expectExact = testCase.expectExact;
		//const expected = testCase.expected;
		//const expectedConsole = testCase.expectedConsole
		
		
		const code = script 
			+ "\n" + langInfo.argsFormatter(args)
			+ "\n" + testCode;
		
		// console.log(`executing:\n--------------\n${code}\n---------------\n`);
		let returned = undefined;
		const start = new Date().getTime();
		const res = { run:true, test, index:i}
		
		for (let id in PLUGINS) {
			expected[id] = test["expect" + id] ? true : false;
			//console.log("Expecting:",id,test["expect"+id])
			if (expected[id]) {
				//console.log("pre: expecting", id, "on test", i);
				PLUGINS[id].preRun(test, injected, res);
				res["expect"+id] = true;
			}
		}
		
		let result = null;
		try {
			runTask = langInfo.exec(code, injected);
			await runTask;
			returned = result = await langInfo.extract();
			//M.toast({html: "Run Finished.", classes:"green", displayLength: 2000  } );
		} catch (e) {
			if (e === INTERRUPTED) {
				M.toast({html:`${e}.`, classes:"yellow black-text", displayLength: 1000});
			} else {
				M.toast({html:`Script Error. ${e}`, classes:"red" })
				console.error("e");
			}
		}
		const end = new Date().getTime();
		
		const consoleOutput = simConsole.buffer;
		const elapsedMS = end-start;
		//const matchedReturnValue = expectExact 
		//	? result === expected
		//	: (!expected || result === expected);
		res.elapsedMS = elapsedMS;
		res.returned = returned;
		
		for (let id in PLUGINS) {
			const plugin = PLUGINS[id];
			if (expected[id]) {
				res[id] = plugin.extract(result);
				plugin.postRun(test, injected, res);
				
				res["matched"+id] = plugin.check(test["expected"+id], res[id]);
			}
			
		}
			
		// const matchedConsoleOutput = !expectedConsole || simConsole.buffer === expectedConsole;
		
		// const res = { 
		// 	elapsedMS, returnVal,
		// 	consoleOutput, 
		// 	matchedReturnValue, 
		// 	matchedConsoleOutput, 
		// 	testCase: test 
		// }
		// console.log(res);
		
		results[i] = res;
	}
	return results;
}