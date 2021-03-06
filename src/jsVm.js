import { VmInfo } from "./vm.js";

/** @type {VmInfo} */
export const jsInfo = {
	mode: "javascript",
	ready: true,
	exec,
	extract,
	argsFormatter,
	onError,
}
export default jsInfo;

export function argsFormatter(args) {
	const argsLine = "const args = " + JSON.stringify(args);	
	console.log("js arguments:\n"+argsLine);
	return argsLine;
}

let runTask = null;
export async function exec(code, injected) {
	return (runTask = evaluate(code, "dynamic", 1, injected));
}
export async function extract() {
	return await runTask;
}

export async function onError(scriptEntry, error) {
	
	M.toast({html:`Script Error. ${error}`, classes:"red" })
}
