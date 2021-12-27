import * as vm from "./src/vm.js";
import { Lesson } from "./src/lesson.js";
import { goToLesson } from "./execute.js"
import { GLOBALS, render, appendRender, show, delay, queryParams  } from "./common.js"
import { showBrowse } from "./browse.js";

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
	// showLesson(Categories["Intro"]["js"][0]);
	// showLesson(Categories["Intro"]["js"][1]);
	
	const lessonID = queryParams["lesson"];
	if (lessonID) {
		goToLesson(lessonID);
	} else {
		showBrowse();
	}
	// console.log("QPs are", queryParams);
});