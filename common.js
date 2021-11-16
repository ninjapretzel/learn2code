import {jsInfo} from "./jsVm.js";
import {pyInfo} from "./pyVm.js";
import * as vm from "./vm.js";

let codeEditor = undefined;
const queryParams = urlParam();
const LANG = queryParams["lang"] || "js";
const PY = LANG === "py";
const JS = LANG === "js";


let lesson = {
	Content: {
		Category: "Untitled Category",
		Lesson: "Untitled Lesson",
		LessonText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
	},
	
	Preamble: "function placeholder(a,b,c) {",
	InitialCode: "\n\t// Edit Me!\n",
	Postamble: "}",
	TestCases: [
		{ 
			args: ["args", "value", "or", "array"], 
			expectReturnValue: true,
			expected: "expectedReturn", 
			expectConsoleOutput: true,
			expectedConsole: "expected console output" 
		},
	],
	TestCode: "placeholder(args[0], args[1], args[2]);",
}


let langInfo = {
	argsFormatter: JSON.stringify,
	mode: "javascript", // Name of code mirror highlighting mode...
	ready: true,
	exec: async function(code, injected) { },
	extract: async function() { return undefined; },
}
async function exec() {
	let script = codeEditor.getValue();
	results = await vm.execInternal(script, lesson, langInfo);
	rerenderTestCases();
}
if (JS) {
	langInfo = jsInfo;
} else if (PY) {
	langInfo = pyInfo;
} else {
	console.warn("No valid language set- defaulting to javascript.");
	langInfo = jsInfo;
}

// Collect information:
// inputs & Timings of inputs
// eg be able to replay a student's attempt
// what they typed, where (cursor position), and how long they paused 
// When they ran code

// Different languages:
// Python Interpreter in JS
// 

// Image drawing version


// Interface:
//  Doc links embedded in each lesson

async function fetchJson(path) { 
	const headers = new Headers();
	headers.append('pragma', 'no-cache');
	headers.append('cache-control', 'no-cache');
	const req = new Request(path);
	const res = await fetch(req, headers);
	return await res.json();
}

let results = []

function measure(str) {
	let line = 0;
	let ch = 0;
	for (let i = 0; i < str.length; i++) {
		if (str[i] == "\n") { ch = 0; line+=1; }
		else { ch += 1; }	
	}
	return {line,ch};
}
function upgradeBrowser() {
	$(".main").addClass("hidden");
	$(".upgrade").removeClass("hidden");
}

function failedToLoad() {
	$(".main").addClass("hidden");
	$(".failedToLoad").removeClass("hidden");
}
function showLesson() {
	for (let x in lesson.Content) {
		const element = $("#"+x);
		if (element.length != 0) { 
			element.html(lesson.Content[x]);
		}	
	}
	rerenderTestCases();
}

function rerenderTestCases() {
	$("#output").empty();
	renderTestCases();
}


// May allow for custom rendering of test cases, 
// if lessons want to provide custom solutions for this.
let renderTestCases = function() {
	function passFail(result, key) {
		if (result) {
			if (result[key]) { return 1; }
			return 2;
		}
		return 0;
	}
	const passFailColors = [ "blue-grey", "green", "red" ];
	
	const output = $("#output");
	let i = 0;
	console.log("rendering tests in",lesson.TestCases);
	for (let test of lesson.TestCases) {
		const result = results[i++];
		const element = $("<li>");
		const header = $("<div>");
		header.addClass("collapsible-header card blue-grey test");
		header.append("Test Case #"+i + " ");
		
		
		const body = $("<div>");
		body.addClass("collapsible-body card row blue-grey test");
		element.append(header);
		element.append(body);
		let wasFailure = false;
		
		if (test.expectReturnValue) {
			const chip = $("<div>keyboard_return</div>");
			chip.addClass("right chip material-icons lighten-2");
			let text = "Expecting result of " + JSON.stringify(test.expected);	
			if (result) {
				text += "\nGot " + JSON.stringify(result.returnVal);
				if (!result.matchedReturnValue) { wasFailure = true; }
			} else {
				text += "\nNot run yet...";	
			}
			const div = $("<div>");
			div.addClass("col s12 card test");
			const color =passFailColors[passFail(result, "matchedReturnValue")] 
			div.addClass(color);
			chip.addClass(color);
			div.append($("<pre>"+text+"</pre>"));
			body.append(div)
			header.append(chip);
		}
		
		if (test.expectConsoleOutput) {
			const chip = $("<div>print</div>");
			chip.addClass("right chip material-icons lighten-2");
			
			const div = $("<div>");
			div.addClass("col s12 card test");
			const color = passFailColors[passFail(result, "matchedConsoleOutput")];
			div.addClass(color);
			chip.addClass(color);
			
			
			div.append("<span>Expected Console Output:</span>");
			div.append("<pre>"+test.expectedConsole+"</pre>");
			if (result) {
				if (!result.matchedConsoleOutput) { wasFailure = true; }
				if (result.consoleOutput.length == 0) { 
					div.append("<span>Got: </span><pre>(nothing)</pre>");	
					
				} else {
					div.append("<span>Got:</span><pre>"+result.consoleOutput+"</pre>");	
				}
			} else {
				div.append("<span>Not run yet</span><pre>...</pre>");
			}
			body.append(div);
			header.append(chip);
		}
		header.append("<pre>args="+JSON.stringify(test.args)+"</pre>");
		output.append(element);
		
		if (wasFailure) {
			console.log(i, "was failure");
			$('.collapsible').collapsible('open', i-1);
		}
			
		
	}
}

$(document).ready(async ()=>{
	if (!localStorage) { upgradeBrowser(); return; }
	let jsToLoad = "";
	
	// let res = await fetchJson(`data/${LANG}/${LESSON_ID}.json`);
	let res = await fetchJson(`data/${LANG}/test.json`);
	
	if (res) { lesson = res; showLesson(); }
	else { failedToLoad(); return; }
	
	const startMarker = { line: -1, ch:-1 }
	if (lesson.Preamble) { jsToLoad += lesson.Preamble; }
	const endOfPreamble = measure(jsToLoad);
	
	if (lesson.InitialCode) { jsToLoad += lesson.InitialCode; }
	const startOfPostamble = measure(jsToLoad);
	if (lesson.Postamble) { jsToLoad += lesson.Postamble; }
	const endMarker = measure(jsToLoad);
	if (lesson.Postamble) { endMarker.line += 1; endMarker.ch+=1; }
	
	$("#run").click(()=>{ exec(); });
	setTimeout(()=>{
		codeEditor = CodeMirror(document.getElementById("scriptEntry"), {
			value: jsToLoad,
			mode: langInfo.mode,	
			theme: "solarized dark",
			indentUnit: 4,
			smartIndent: true,
			tabSize: 4,
			indentWithTabs: true,
			electricChars: false, // ??? No idea what that does. 
			lineNumbers: true,
		})
		
		setTimeout(()=>{
			if (lesson.Preamble) {
				codeEditor.markText(startMarker, endOfPreamble, { inclusiveLeft: true, readOnly: true});
			}
			if (lesson.Postamble) {
				codeEditor.markText(startOfPostamble, endMarker, { inclusiveRight: true, readOnly: true});
			}
		}, 100);
			
		try { $('.tooltipped').tooltip(); } catch (e) { console.warn(e); }
		try { $('.collapsible').collapsible( {accordion: false} ); } catch (e) { console.warn(e); }
	}, 100);
	
});


function urlParam() {
	const result = {};
	const items =  location.search.substr(1).split("&");
	for (let i = 0; i < items.length; i++) {
		const split = items[i].split("=");
		result[split[0].toLowerCase()] = decodeURIComponent(split[1]).toLowerCase();
	}
	return result;
}