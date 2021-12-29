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
			const plugin = PLUGINS[id];
			if (plugin.isExpected(lesson)) {
				expected[id] = true;
				plugin.preRun(test, injected, res);
				res["expect"+id] = true;
			}
		}
		
		let result = null;
		try {
			runTask = langInfo.exec(code, injected);
			await runTask;
			returned = result = await langInfo.extract();
			console.log("test", i, "returned", returned);
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
		const elapsedMS = end-start;
		//const matchedReturnValue = expectExact 
		//	? result === expected
		//	: (!expected || result === expected);
		res.elapsedMS = elapsedMS;
		res.returned = returned;
		console.log("Before postRun: ", res);
		
		for (let id in PLUGINS) {
			const plugin = PLUGINS[id];
			if (plugin.isExpected(test)) {
				res[id] = plugin.extract(res);
				console.log("Result for",id,"is<", res[id],">");
				// Note to self: pass whole result object to plugin, not just the current id's result...
				const judge = plugin.judge(test, res); 
				
				const checked = check(judge);
				
				if (typeof(checked) === "boolean") {
					res["matched"+id] = checked;
					//console.log(id, "Got matched:", checked);
				} else if (typeof(checked) === "number") {
					if (typeof(judge.distance) === "number") {
						res["distance"+id] = checked;
						const threshold = test["thresholdDistance"+id] || plugin.distanceThreshold
						res["matched"+id] = judge.distance <= threshold
						//console.log(id, "Got distance:", checked);
					} else if (typeof(judge.accuracy) === "number") {
						res["accuracy"+id] = checked;
						const threshold = test["thresholdAccuracy"+id] || plugin.accuracyThreshold
						res["matched"+id] = judge.accuracy >= threshold
						//console.log(id, "Got accuracy:", checked);
					}
				} else {
					console.log("wtf Got judgement", judge);
				}
				
				plugin.postRun(test, injected, res);
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