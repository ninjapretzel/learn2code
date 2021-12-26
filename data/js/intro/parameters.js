import { Lesson } from "../../../src/lesson.js";

/** @type {Lesson} */
export default {
	Content: {
		Category: "Intro",
		Lesson: "Parameters", 	
		LessonText: "This time, your function will take in a parameter and say hello to it."
		+"\nHint: use string literals like \"Hello\" or \'Hello\' and add them to the parameter",
		DocLinks: [""]
	},
	Preamble: "function hello(thing) {",
	InitialCode: "\n\t// Edit Me!\n",
	Postamble: "}",
	TestCases: [
		{ 
			args: "a", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, a!" 
		},
		{ 
			args: "bob", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, bob!" 
		},
		{ 
			args: "Bob", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, Bob!" 
		},
		{ 
			args: "George", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, George!" 
		},
		{ 
			args: "George", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, George!" 
		},
		{ 
			args: "George", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, George!" 
		},
		{ 
			args: "George", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, George!" 
		},
		{ 
			args: "George", 
			expectReturnValue: false,
			expectConsoleOutput: true,
			expectedConsoleOutput: "Hello, George!" 
		},
		
	],
	TestCode: "hello(args);",
	AlwaysOpen: true,
}