export const jsInfo = {
	mode: "javascript",
	ready: true,
	exec,
	extract,
	argsFormatter,
}

export function argsFormatter(args) {
	return "const args = " + JSON.stringify(args);	
}

let runTask = null;
export async function exec(code, injected) {
	return (runTask = evaluate(code, "dynamic", 1, injected));
}
export async function extract() {
	return await runTask;	
}

