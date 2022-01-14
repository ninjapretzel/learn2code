import { urlParam } from "./src/pageUtils.js";
export const queryParams = urlParam();
export const GLOBALS = {};
window.GLOBALS = GLOBALS;

/// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
export function uuidv4_1() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}
export function uuidv4_2() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}
export function uuidv4() {
	if (crypto) {
		if (crypto.randomUUID) { return crypto.randomUUID(); }
		return uuidv4_1();	
	}
	return uuidv4_2();
}

GLOBALS.uuidv4 = uuidv4;




export function getUserId() {
	let id = localStorage.getItem("USER-ID");
	if (id) { return id; }
	id = uuidv4();
	localStorage.setItem("USER-ID", id);
	return id;	
}



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

/// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
export function replaceAll(str, find, replace) {
	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
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

function processData(data, seen) {
	if (!seen) { seen=[]; }
	const result = Array.isArray(data) ? [] : {};
	for (let key in data) {
		if (seen.indexOf(data[key]) >= 0) { continue; }
		seen[seen.length] = data[key];
		if (typeof(data[key]) === "string") {
			if (data[key].includes("\n")) {
				result[key] = data[key].replace(/(?:\r\n|\r|\n)/g, "<br />")
			} else {
				result[key] = data[key];
			}
		} else if (typeof(data[key]) === "object") {
			result[key] = processData(data[key], seen);	
		} else {
			result[key] == data[key];	
		}
	}
	return result;
}

export function render(where, what, data) {
	const query = $(where);
	if (TEMPLATES && TEMPLATES[what]) {
		what = TEMPLATES[what].draw(data);
	} else {
		if (TEMPLATES) { console.warn("Could not find template", what); }
		else { console.error("TEMPLATES constant is falsey!"); }	
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
	// console.log("appendRender with data",data);
	if (TEMPLATES && TEMPLATES[what]) {
		what = TEMPLATES[what].draw(data);
	} else {
		if (TEMPLATES) { console.warn("Could not find template", what); }
		else { console.error("TEMPLATES constant is falsey!"); }	
	}
	let rendered = null;
	if (query && query[0]) {
		const temp = $("#temp")
		rendered = ReactDOM.render(what, temp[0]);
		ReactDOM.unmountComponentAtNode($("#temp")[0]);
		$("#temp").empty();
		query.append($(rendered));
	}
	return rendered;
}

export function delay(ms) {
	return new Promise((resolve, reject)=>{
		setTimeout(()=>{resolve(true);}, ms);
	})
}


