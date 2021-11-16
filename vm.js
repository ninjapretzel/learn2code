/// File holding generic (language-agnostic) virtual machine functionality.


let delay = 1;
let running = false;
let runId = 0;
let runTask = null;
const INTERRUPTED = "INTERRUPTED";

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
/** Reference to functions that are injected on each run */
export const injectedFunctions = {
	print: simConsole.print,
	println: simConsole.println
}

export async function execInternal(script, lesson, langInfo) {
	const results = [];
	running = true;
	runId = interp.runId;
	
	const testCode = lesson.TestCode;
	for (let i = 0; i < lesson.TestCases.length; i++) {
		const test = lesson.TestCases[i];
		
		const args = test.args;
		const expectExact = test.expectExact;
		const expected = test.expected;
		const expectedConsole = test.expectedConsole;
		
		const code = script 
			+ "\n" + langInfo.argsFormatter(args)
			+ "\n" + testCode;
		
		// console.log(`executing:\n--------------\n${code}\n---------------\n`);
		let returnVal = undefined;
		simConsole.clear();
		const start = new Date().getTime();
		let result = null;
		try {
			runTask = langInfo.exec(code, injectedFunctions);
			await runTask;
			returnVal = result = await langInfo.extract();
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
		const matchedReturnValue = expectExact 
			? result === expected
			: (!expected || result === expected);
			
		const matchedConsoleOutput = !expectedConsole || simConsole.buffer === expectedConsole;
		
		const res = { elapsedMS, returnVal, consoleOutput, matchedReturnValue, matchedConsoleOutput }
		// console.log(res);
		results[i] = res;
	}
	return results;
}