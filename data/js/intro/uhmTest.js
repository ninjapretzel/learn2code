import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Hello World", 	
		LessonText: "The first thing any programmer does is make their computer say"
			+ "\n\"Hello, World!\"."
			+ "\nUse the print(\"stuff\") function",
		DocLinks: [""]
	},
	Preamble: "function hello() {",
	InitialCode: "\n\t// Edit Me!\n",
	Postamble: "}",
	TestCases: [
		{ 
			args: undefined, 
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, World!" 
		},	
	],
	TestCode: "hello();",
	AlwaysOpen: true,
}