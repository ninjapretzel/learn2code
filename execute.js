import { queryParams, measure, show  } from "./common.js"
import { Lesson } from "./src/lesson.js"
import * as vm from "./src/vm.js"


const LANG = queryParams["lang"] || "js";
const PY = LANG === "py";
const JS = LANG === "js";

export let lesson = new Lesson();


export let results = []
/** @type {CodeMirror} - Code editor on page */
export let codeEditor = undefined;
/** @type {La*/
export let langInfo = {
	argsFormatter: JSON.stringify,
	mode: "javascript", // Name of code mirror highlighting mode...
	ready: true,
	exec: async function(code, injected) { },
	extract: async function() { return undefined; },
}
let codeToLoad = "";

async function loadLanguage() {
	console.log("loading lang="+LANG);
	if (JS) {
		console.log("Importing js");	
		langInfo = await import("./src/jsVm.js");
	} else if (PY) {
		console.log("Importing py");;
		langInfo = await import("./src/pyVm.js");
	} else {
		console.warn("No valid language set- defaulting to javascript.");
		langInfo = await import("./src/jsVm.js");
	}
	if (langInfo.default) {
		langInfo = langInfo.default
	}
}
await loadLanguage(); // Preload language. Might be called again later.


export async function exec() {
	let script = codeEditor.getValue();
	results = await vm.execInternal(script, lesson, langInfo);
	rerenderTestCases();
}

function rerenderTestCases() {
	$("#output").empty();
	renderTestCases();
}

let markers = [];

function clearMarkers() {
	for (let mark of markers) { mark.clear(); }
	markers = []	
}

export function showLesson(l) {
	if (l) { lesson = l }
	
	for (let x in lesson.Content) {
		const element = $("#"+x);
		if (element.length != 0) { 
			element.html(lesson.Content[x]);
		}	
	}
	
	codeToLoad = "";
	const startMarker = { line: -1, ch: -1 };
	if (lesson.Preamble) { codeToLoad += lesson.Preamble; }
	const endOfPreamble = measure(codeToLoad); 
	
	if (lesson.InitialCode) { codeToLoad += lesson.InitialCode; }
	const startOfPostamble = measure(codeToLoad);
	if (lesson.Postamble) { codeToLoad += lesson.Postamble; }
	const endMarker = measure(codeToLoad); 
	if (lesson.Postamble) { endMarker.line += 1; endMarker.ch+=1; }
	
	clearMarkers();
	codeEditor.setValue(codeToLoad);
	if (lesson.Preamble) { 
		codeEditor.markText(startMarker, endOfPreamble, { inclusiveLeft: true, readOnly: true});
	}
	if (lesson.Postamble) {
		codeEditor.markText(startOfPostamble, endMarker, { inclusiveRight: true, readOnly: true});
	}
	
	rerenderTestCases();
}

export let renderTestCases = function() {
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
			const color = passFailColors[passFail(result, "matchedReturnValue")] 
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
		
		if (wasFailure || lesson.AlwaysOpen) {
			console.log(i, "was failure");
			$('.collapsible').collapsible('open', i-1);
		}
			
		
	}
}

let firstTime = true;
export async function showExec() {
	show("exec");
	if (firstTime) {
		await CodeMirrorLoader;
			
	}
	
		
}

const CodeMirrorLoader = new Promise( (resolve, reject)=>{
	
	$("#run").click(()=>{ exec(); });
	setTimeout( ()=>{ 
		// Delay another 1 ms, 
		// for some reason the TextArea isn't always ready in some browsers...
		codeEditor = CodeMirror(document.getElementById("scriptEntry"), {
			value: codeToLoad,
			mode: langInfo.mode,	
			theme: "solarized dark",
			indentUnit: 4,
			smartIndent: true,
			tabSize: 4,
			indentWithTabs: true,
			electricChars: false, // ??? No idea what that does. 
			lineNumbers: true,
		});
		
		codeEditor.on("change", function(editor,change) {
			//console.log("editor=",editor);
			//console.log("change=",change);
		});
		
		$("#scriptEntry").keypress(function(e) {
			const evt = e.originalEvent
			const key = evt.key;
			const ctrl = evt.ctrlKey;
			// TODO: Keybind system?
			if (key === "Enter" && ctrl) { exec(); }
		});
		
		resolve(true);
	}, 1);
	
});

