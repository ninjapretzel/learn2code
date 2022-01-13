import { GLOBALS, replaceAll } from "../common.js";
import { VmInfo } from "./vm.js";

/** @type {VmInfo} */
export const pyInfo = {
	mode: "python",	
	ready:false,
	exec,
	extract,
	argsFormatter,
	onError
}
export default pyInfo;

export function argsFormatter(args) {
	return "args = " + JSON.stringify(args)
}

let pyodide = null;
async function load() {
	console.log("Loading pyodide... Normally takes a few seconds...");
	pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/" });
	console.log("Python ready, Version:", pyodide.runPython(`import sys\nsys.version`));
	
	pyInfo.ready = true;
}
const pre =	 "\nundefined=None"
			+"\nnull=None"
			+"\n"
function count(str, c) {
	let cnt = 0;
	for (let i = 0; i < str.length; i++) { if (str[i] === c) { cnt++; } }
	return cnt;
}
const preNewlines = count(pre, "\n");

export async function exec(code, injected) {
	for (let name in injected) {
		pyodide.globals.set(name, injected[name]);
		console.log("Python Injected " + name);
	}
	code = pre + code;
	console.log("Running the following code:\n",code);
	pyodide.runPython(code);
}
export async function extract() {
	return pyodide.globals.get("result");
}

export async function onError(scriptEntry, error) {
	const str = error.toString();
	const search = "File \"<exec>\", line ";
	let idx = str.lastIndexOf(search);
	console.log("pyvm.onError: index at", idx, "in", str);
	idx += search.length;
	let num = ""
	while (str[idx] >= '0' && str[idx] <= '9') {
		num += str[idx];
		idx++;
	}
	idx = str.indexOf("\n", idx) + 1;
	let next = str.indexOf("\n", idx)+1;
	let line = str.substring(idx, next-1);
	idx = next;
	next = str.indexOf("\n", idx) + 1;
	let marker = str.substring(idx, next-1);
	// Pyodide internally uses 4-wide tabs, and converts tabs to spaces...
	// Code mirror uses actual tabs...
	marker = replaceAll(marker, "    ", "\t"); 
	idx = next;
	let err = str.substring(idx);
	let col = marker.indexOf("^");
	if (col === -1) { col = ""; }
	 // I have no idea why this needs to be adjusted by an additional 2...
	num = Number(num) - preNewlines - 2;
	
	console.log("Got line #", num+ "\nline=\""+ line + "\"\nmark=\""+ marker+ "\"\nerr ="+ err);
	M.toast({html:`Script Error on line # ${num}.<br /> ${err}`, classes:"red" });
	let startMark = { line: num, col: 0 }
	let endMark = { line: num+1, col: 0 }
	
	console.log("Marking from", startMark, "to", endMark);
	GLOBALS.clearMarkers()
	GLOBALS.markText(startMark, endMark, { css: "color: #faa;background: #a33" });
	
}

await load();

