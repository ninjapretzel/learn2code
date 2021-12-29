import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Uhm Test", 	
		LessonText: "The first thing any programmer does is make their computer say"
			+ "\n\"Hello, World!\"."
			+ "\nUse the print(\"stuff\") function"
			+ "\nalso, make it return 5... for testing purposes",
		DocLinks: [""]
	},
	Preamble: "def hello:",
	InitialCode: "\n\t# Edit Me!",
	Postamble: "",
	TestCases: [
		{ 
			args: undefined, 
			expectConsoleOutput: true,
			expectedConsole: "Hello, World!",
			expectReturnValue: true,
			expectedReturnValue: 5,
		},	
	],
	TestCode: "result = hello()",
	AlwaysOpen: true, 
}