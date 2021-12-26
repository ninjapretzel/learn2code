import * as vm from "./src/vm.js";
import { Lesson } from "./src/lesson.js";
import { AllLessons, Categories, showBrowse } from "./browse.js"
import { showExec, showLesson } from "./execute.js"
import { GLOBALS, render, appendRender, show, delay } from "./common.js"

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
	
	// initTooltip();
	try { $('.tooltipped').tooltip(); } catch (e) { console.warn(e); }
	// initTooltip( M.Tooltip.getInstance(document.querySelectorAll('.tooltipped')) );
	//initCollapsible();
	try { $('.collapsible').collapsible( {accordion: false} ); } catch (e) { console.warn(e); }
	// collapsible = M.Collapsible.getInstance(document.querySelector('.collapsible.expandable'));

	
	// show("exec");
	// await showExec();
	// await(delay(20));
	showLesson(Categories["Intro"]["js"][0]);
	// showLesson(Categories["Intro"]["js"][1]);
	
	//await showBrowse();
	
	const test1 = <div> hi </div>
	const test2 = <div className="red"> hi </div>
	const test3 = <div> {test1} {test2} </div>
	
	// render("#hello", test3);
	// Okay, I really don't know why this kind of...
	// hybrid jquery-and-babel-had-a-baby-in-the-browser monster
	// isn't the _default_ approach to modern web development...
	// appendRender("#output", "TestResultCard", {
	// 	index:3,
	// 	test:{ 
	// 		args: ["args", "value", "or", "array"], 
	// 		expectReturnValue: true,
	// 		expected: "expectedReturn", 
	// 		expectConsoleOutput: true,
	// 		expectedConsole: "expected console output" 
	// 	},
	// 	result: {}
		
	// });
	
});