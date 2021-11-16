export const pyInfo = {
	mode: "python",	
	ready:false,
	exec,
	extract,
	argsFormatter,
}

export function argsFormatter(args) {
	return "args = " + JSON.stringify(args);	
}

let pyodide = null;
async function load() {
	console.log("Loading pyodide... Normally takes a few seconds...");
	pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/" });
	console.log("Python ready, Version:", pyodide.runPython(`
	import sys
	sys.version
	`));
	
	pyInfo.ready = true;
}

export async function exec(code, injectedFunctions) {
	for (let name in injectedFunctions) {
		pyodide.globals.set(name, injectedFunctions[name]);
	}
	pyodide.runPython(code);	
}
export async function extract() {
	return pyodide.globals.get("result");
}

const loader = load();
