
/** Callback definition ... wish this could be exported explicitly... 
 * @callback expectedValueChecker 
 * @param {any} expected value expected in test case 
 * @param {any} actual value returned from running code
 * @returns {boolean} true if expected and actual value "match", false otherwise. */

/** Class representing a coding lesson */
export class TestCase {
	/** @type {any} Arguments to the function call. . Typically a {string} or {any[]} */
	args = [ "args", "value", "or", "array" ]
	/** @type {boolean} Is there an expected return value from running this test case? */
	expectedReturnValue = true
	/** @type {any} The expected return value, as verbatim as possible. */
	expected = "expectedReturn"
	/** @type {boolean} Is there exact expected console output from running this test case? */
	expectConsoleOutput = true
	/** @type {string} the exact expected console output from running this test case, verbatim. */
	expectedConsole = "expected console output"
	/** @type {undefined|expectedValueChecker} the function to use to check expected values, or undefined or other falsey value to use a default comparison. */
	expectedValueChecker = undefined
}

export class Lesson {
	/** @type {Map<string,string>} Content holds information about the lesson's content   This content is displayed with a rudimentary templating system.  */
	Content = { 
		/** Display breadcrumbs category that holds the lesson */
		Category: "Misc",
		/** Lesson name */
		Lesson: "Untitled Lesson",
		/** Lesson textual content */
		LessonText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	}
	/** @type {string} First part of code the lesson, and is fixed (can't be edited by the student) */
	Preamble = "function placeholder(a,b,c) {" 
	/** @type {string}  Initial code for the lesson that the student can edit. */
	InitialCode = "\n\t// Edit Me!\n"
	/** @type {string} Last part of code the lesson, and is fixed (can't be edited by the student) */
	Postamble = "}"
	/** @type {TestCase[]} Test cases to run */
	TestCases = [ 
		{
			args: [ "args", "value", "or", "array" ],
			expectedReturnValue: true,
			expected: "expectedReturn",
			expectConsoleOutput: true,
			expectConsoleOutput: "expected console output", 
		}
	]
	
}