import { urlParam } from "./src/pageUtils.js";
export const queryParams = urlParam();

export function show(pageID) {
	$(".page").addClass("hidden");
	$(`#${pageID}`).removeClass("hidden");	
}

export function measure(str) {
	let line = 0;
	let ch = 0;
	for (let i = 0; i < str.length; i++) {
		if (str[i] == "\n") { ch = 0; line+=1; }
		else { ch += 1; }	
	}
	return {line,ch};
}

export function render(where, what, data) {
	const query = $(where);
	if (TEMPLATES && TEMPLATES[what]) {
		what = TEMPLATES[what].draw(data);	
	}
	if (query && query[0]) {
		ReactDOM.render( what, query[0]	);
	}
}
