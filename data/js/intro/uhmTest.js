import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Hello World", 	
		LessonText: "The first thing any programmer does is make their computer say"
			+ "\n\"Hello, World!\"."
			+ "\nUse the print(\"stuff\") function"
			+ "\nalso, make it return 5... for testing purposes"
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
		},	
	],
	TestCode: "hello();",
	AlwaysOpen: true,
}