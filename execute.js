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

const CODE_PREFIX = "entry-"
function getCode(id) { 
	const key = CODE_PREFIX+LANG+"-"+id;
	// console.log("reading key", key);
	return localStorage.getItem(key);
}
function setCode(id, value) {
	const key = CODE_PREFIX+LANG+"-"+id; 
	// console.log("Got starting code ", value);
	value = value.replace(lesson.Preamble, "");
	// console.log("Replaced Preamble to ", value);
	value = value.replace(new RegExp(lesson.Postamble+"$"), "");
	// console.log("Replaced Postamble to ", value);
	// console.log("Setting localstorage key", key, "to", value);
	localStorage.setItem(key, value); 
}

export async function exec() {
	let script = codeEditor.getValue();
	setCode(lesson.id, script);
	results = await vm.execInternal(script, lesson, langInfo);
	rerenderTestCases();
}

function rerenderTestCases() {
	$("#output").empty();
	renderTestCases();
}

let markers = [];
let permMarkers = [];

function clearMarkers() {
	for (let mark of markers) { mark.clear(); }
	markers = [];
	GLOBALS.markers = markers;
}
function clearPermMarkers() {
	for (let mark of permMarkers) { mark.clear(); }
	permMarkers = [];
}

/** Globally accessible function that resets plugin-added CodeMirror text editor's markings */
GLOBALS.clearMarkers = clearMarkers;

GLOBALS.markText = function(start, end, options) {
	markers.push(codeEditor.markText(start, end, options));
}

/** Shows the given lesson object
 * @param {Lesson} l Lesson object to show */
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
	
	const storedCode = getCode(lesson.id);
	if (storedCode) { codeToLoad += storedCode; }
	else if (lesson.InitialCode) { codeToLoad += lesson.InitialCode; }
	
	const startOfPostamble = measure(codeToLoad);
	if (lesson.Postamble) { codeToLoad += lesson.Postamble; }
	const endMarker = measure(codeToLoad); 
	if (lesson.Postamble) { endMarker.line += 1; endMarker.ch+=1; }
	
	await showExec();
	clearMarkers();
	clearPermMarkers();
	codeEditor.setValue(codeToLoad);
	if (lesson.Preamble) { 
		permMarkers.push(codeEditor.markText(startMarker, endOfPreamble, { inclusiveLeft: true, readOnly: true}));
	}
	if (lesson.Postamble) {
		permMarkers.push(codeEditor.markText(startOfPostamble, endMarker, { inclusiveRight: true, readOnly: true}));
	}
	rerenderTestCases();
	for (let id in PLUGINS) {
		const plugin = PLUGINS[id];
		if (plugin.isExpected(l)) {
			plugin.ready(l);
		}
	}
	
	history.replaceState( {}, "", `?lang=${l.lang}&lesson=${l.id}` );
}

export function lessonFor(catName, id) {
	catName = catName.toLowerCase();
	const lowCats = {}
	for (let key in Categories) { lowCats[key.toLowerCase()] = Categories[key]; }
	const cat = lowCats[catName];
	if (!cat) { throw new Error(`No Lesson Category named '${catName}'`); }
	const lang = cat[GLOBALS.LANG];
	if (!lang) { throw new Error(`No Language '${GLOBALS.LANG}' in category ${catName}`); }
	let idx = -1;
	if (typeof(id) === "string") {
		id = id.toLowerCase();
		for (let i = 0; i < lang.length; i++) {
			if (lang[i].Content.Lesson.toLowerCase() === id) {
				idx = i; 
				break;
			}
		}
	} else if (typeof(id) === "number") {
		idx = id;
	}
	if (idx < 0 || idx > lang.length) { throw new Error(`No lesson with id ${id}`); }
	return lang[idx];
}

export function goToLesson(cat, id) {
	if (!id && cat.includes('.')) {
		try {
			//console.log("Attempting to load \""+lessonID+"\"");
			const splits = cat.split(".");;
			console.log("splits=",splits);
			const catName = splits[0].toLowerCase(); // One browser goes lowercase for query params... ugh
			const lessonName = splits[1].toLowerCase();
			console.log(catName, lessonName);
			showLesson(lessonFor(catName, lessonName));
		} catch (e) { 
			console.error(e);
			showBrowse();
		}
	} else {
		if (!cat) { showBrowse(); }
		else {
			showLesson(lessonFor(cat, id));
		}
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
		$("#clearErrors").click(()=>{ GLOBALS.clearMarkers(); });
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
			GLOBALS.codeEditor = codeEditor;
			
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
