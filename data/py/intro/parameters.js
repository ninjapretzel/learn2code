import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Parameters", 	
		LessonText: "This time, your function will take in a parameter and say hello to it.",
		DocLinks: [""]
	},
	Preamble: "def hello(thing):",
	InitialCode: "\n\t# Edit Me!",
	Postamble: "",
	TestCases: [
		{ 
			args: "a", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsole: "Hello, a!" 
		},
		{ 
			args: "b", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsole: "Hello, b!" 
		},
	],
	TestCode: "result = hello(args);",
	AlwaysOpen: true,
}