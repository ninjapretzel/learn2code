import { showBrowse, Categories } from "./browse.js";
import { queryParams, measure, show, render, delay, expandCollapsible, appendRender, GLOBALS } from "./common.js"
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


export async function showLesson(l) {
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
	
	await showExec();
	clearMarkers();
	codeEditor.setValue(codeToLoad);
	if (lesson.Preamble) { 
		codeEditor.markText(startMarker, endOfPreamble, { inclusiveLeft: true, readOnly: true});
	}
	if (lesson.Postamble) {
		codeEditor.markText(startOfPostamble, endMarker, { inclusiveRight: true, readOnly: true});
	}
	rerenderTestCases();
	for (let id in PLUGINS) {
		const plugin = PLUGINS[id];
		plugin.ready();
	}
}

export function goToLesson(lessonID) {
	if (lessonID) {
			
		try {
			const lowCats = {}
			for (let key in Categories) { lowCats[key.toLowerCase()] = Categories[key]; }
			//console.log("Attempting to load \""+lessonID+"\"");
			const splits = lessonID.split(".");;
			//console.log("splits=",splits);
			const catName = splits[0].toLowerCase(); // One browser goes lowercase for query params... ugh
			const lessonName = splits[1].toLowerCase();
			
			const cat = lowCats[catName];
			if (!cat) { console.log("No category", catName); throw "oops"; }
			//console.log("got category", catName, "->", cat);
			const lang = cat[GLOBALS.LANG];
			if (!lang) { console.log("No language", GLOBALS.LANG); throw "oops"; }
			//console.log("got language", GLOBALS.LANG, "->", lang);
			let idx = -1;
			for (let i = 0; i < lang.length; i++) {
				if (lang[i].Content.Lesson.toLowerCase() === lessonName) {
					idx = i;
					break;
				}
				// if (lang[i].Content.Lesson.equalsIgnoreCase(lessonName)) { idx = i; break; }	
			}
			if (idx < 0) { console.log("No lesson", lessonName); throw "oops"; }
			//console.log("got lesson", lessonName, "->", lang[idx]);
			showLesson(lang[idx]);
		} catch (e) { 
			console.error(e);
			showBrowse();
		}
	} else {
		showBrowse();
	}	
}
GLOBALS.goToLesson = goToLesson;

export let renderTestCases = async function() {
	function passFail(result, key) {
		if (result) {
			if (result[key]) { return 1; }
			return 2;
		}
		return 0;
	}
	// Todo: load these from `localStorage.config` for colorblindness...
	const passFailClasses = [ "blue-grey", "green", "red" ];
	// const passFailClasses = [ "neutral", "success", "failure" ];
	
	const output = $("#output");
	let i = 0;
	
	console.log("rendering tests in",lesson.TestCases);
	for (let test of lesson.TestCases) {
		// render(TEMPLATES["TestResultCard"], )
		const result = results[i++];
		let wasFailure = false;
		appendRender("#output", "TestResultCard", result || {run:false,test,index:i});
		
		if (lesson.AlwaysOpen) {
			console.log(i, "was failure");
			expandCollapsible(true, i-1);
		}
		
	}
}

let firstTime = true;
export async function showExec() {
	show("exec");
	render("#exec", "Execute", lesson);
	$("#scriptEntry")
	await delay(20);
	await LoadCodeMirror();
	
}

// const CodeMirrorLoader = LoadCodeMirror();
function LoadCodeMirror() { 
	return new Promise( (resolve, reject)=>{
	
		$("#run").click(()=>{ exec(); });
		setTimeout( ()=>{ 
			// Delay another 1 ms, 
			// for some reason the TextArea isn't always ready in some browsers...
			codeEditor = CodeMirror($("#scriptEntry")[0], {
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
		}, 2);
		
	});
}

GLOBALS.LANG = LANG;
GLOBALS.showLesson = showLesson;
