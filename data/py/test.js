import { Lesson } from "../../src/lesson.js";

/** @type {Lesson} */
export const testLesson = {
	Content: {
		Category: "Blah",
		Lesson: "Test", 	
		LessonText: "Just like make it return expected and print \"expected console output\" my dude.",
		DocLinks: [""]
	},
	Preamble: "def nope(val):\n\t",
	InitialCode: "# Edit Me!",
	Postamble: "",
	TestCases: [
		{ 
			args: ["args", "value", "or", "array"], 
			expectReturnValue: true,
			expected: "expectedReturn", 
			expectConsoleOutput: true,
			expectedConsole: "expected console output" 
		},
		{ 
			args: "argstringlol", 
			expected: "expectedReturn", 
			expectReturnValue: true,
			expectConsoleOutput: true,
			expectedConsole: "expected console output" 
		}
			
	],
	TestCode: "result = nope(args)",
	AlwaysOpen: true,
}
export default testLesson;