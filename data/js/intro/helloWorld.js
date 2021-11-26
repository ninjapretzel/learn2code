import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Hello World", 	
		LessonText: "The first thing any programmer does is make their computer say "
			+ "\"Hello, World!\"."
			+ "Use the `print()` function to do that.",
		DocLinks: [""]
	},
	Preamble: "function hello() {",
	InitialCode: "\n\t// Edit Me!\n",
	Postamble: "}",
	TestCases: [
		{ 
			args: undefined, 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsole: "Hello, World!" 
		},	
	],
	TestCode: "hello();",
	AlwaysOpen: true,
}