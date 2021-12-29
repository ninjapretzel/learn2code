import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Uhm Test", 	
		LessonText: "The first thing any programmer does is make their computer say"
			+ "\n\"Hello, World!\"."
			+ "\nUse the print(\"stuff\") function"
			+ "\nalso, make it draw an 'x' using `line(x1,y1,x2,y2)`... for testing purposes"
			+ "\nalso, make it return 5... for testing purposes"
		,
		DocLinks: [""]
	},
	Preamble: "def hello():",
	InitialCode: "\n\t# Edit Me!",
	Postamble: "",
	TestCases: [
		{ 
			args: null, 
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, World!",
			expectReturnValue: true,
			expectedReturnValue: 5, 
			expectDrawing: true,
			expectedDrawing: function() {
				const canvas = $("#backCanvas")[0];
				const d = {};
				PLUGINS["Drawing"].canvasSetup(canvas, d);
				d.line(20,20,80,80);
				d.line(20,80,80,20);
				
				return window.extractPixels("#backCanvas");
			}
		},	
	],
	TestCode: "result = hello()",
	AlwaysOpen: true,
}