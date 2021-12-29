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
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, a!" 
		},
		{ 
			args: "b",
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, b!" 
		},
	],
	TestCode: "result = hello(args);",
	AlwaysOpen: true,
}