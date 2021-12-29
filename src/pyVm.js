import { VmInfo } from "./vm.js";

/** @type {VmInfo} */
export const pyInfo = {
	mode: "python",	
	ready:false,
	exec,
	extract,
	argsFormatter,
}
export default pyInfo;

export function argsFormatter(args) {
	return "args = " + JSON.stringify(args)
}

let pyodide = null;
async function load() {
	console.log("Loading pyodide... Normally takes a few seconds...");
	pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/" });
	console.log("Python ready, Version:", pyodide.runPython(`
	import sys
	sys.version
	undefined=None;
	null=None;
	`));
	
	pyInfo.ready = true;
}

export async function exec(code, injected) {
	for (let name in injected) {
		pyodide.globals.set(name, injected[name]);
		console.log("Injected " + name);
	}
	code = ""
	+"\nundefined=None"
	+"\nnull=None"
	+"\n"+code
	console.log("Running the following code:\n",code);
	pyodide.runPython(code);
}
export async function extract() {
	return pyodide.globals.get("result");
}

export async function onError(scriptEntry, errors) {
	
}

await load();

