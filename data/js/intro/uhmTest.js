import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Uhm Test", 	
		LessonText: "The first thing any programmer does is make their computer say"
			+ "\n\"Hello, World!\"."
			+ "\nUse the print(\"stuff\") function"
			+ "\nalso, make it return 5... for testing purposes"
			+ "\nalso, make it draw an 'x'... for testing purposes"
		,
		DocLinks: [""]
	},
	Preamble: "function hello() {",
	InitialCode: "\n\t// Edit Me!\n",
	Postamble: "}",
	TestCases: [
		{ 
			args: undefined, 
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
				const ctx = canvas.getContext('2d');
				const img = ctx.getImageData(0,0,ctx.width, ctx.height);
				return img.data;
			}
		},	
	],
	TestCode: "hello();",
	AlwaysOpen: true,
}