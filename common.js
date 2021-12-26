import { urlParam } from "./src/pageUtils.js";
export const queryParams = urlParam();
export const GLOBALS = {};

export function expandCollapsible(open, index) {
	try { $('.collapsible').collapsible( {accordion: false} ); } 
	catch (e) { console.warn("failed to initialize collapsibles", e); return; }
	if (open) {
		$('.collapsible').collapsible('open', index);
	} else {
		$('.collapsible').collapsible('close', index);
	}
}

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
	let rendered = null;
	if (query && query[0]) {
		rendered = ReactDOM.render( what, query[0]);
		console.log(rendered);
	}
	return rendered;
}
export function appendRender(where, what, data) {
	const query = $(where);
	if (TEMPLATES && TEMPLATES[what]) {
		what = TEMPLATES[what].draw(data);	
	}
	let rendered = null;
	if (query && query[0]) {
		const temp = $("#temp")
		rendered = ReactDOM.render(what, temp[0]);
		$("#temp").empty();
		query.append($(rendered));
	}
	return rendered();
}

export function delay(ms) {
	return new Promise((resolve, reject)=>{
		setTimeout(()=>{resolve(true);}, ms);
	})
}
