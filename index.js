import * as vm from "./src/vm.js";
import { Lesson } from "./src/lesson.js";
import { AllLessons, Categories } from "./browse.js"
import { showExec, showLesson } from "./execute.js"
import { show } from "./common.js"

// Collect information:
// inputs & Timings of inputs
// eg be able to replay a student's attempt
// what they typed, where (cursor position), and how long they paused 
// - Can hook into `on("change", function(codeMirror, change){})` to read changes

// When they ran code
// - record state of entry whenever `exec()` is run

// Image drawing plugin
// - time to build a plugin system!

// Interface:
//  Doc links embedded in each lesson


$(document).ready(async ()=>{
	// TODO: Move to a featureCheck() function?
	if (!localStorage) { show("upgrade"); return; }
	if (!crypto) { show("upgrade"); return; }
	
	await import("./browse.js");
	await import("./execute.js");
	
	try { $('.tooltipped').tooltip(); } catch (e) { console.warn(e); }
	try { $('.collapsible').collapsible( {accordion: false} ); } catch (e) { console.warn(e); }
	
	// show("exec");
	showExec();
	showLesson(Categories["Intro"]["js"][0]);
});