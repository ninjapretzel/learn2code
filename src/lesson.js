
/** Callback definition ... wish this could be exported explicitly... 
 * @callback expectedValueChecker 
 * @param {any} expected value expected in test case 
 * @param {any} actual value returned from running code
 * @returns {boolean} true if expected and actual value "match", false otherwise. */

/** Class representing a coding lesson */
export class TestCase {
	/** @type {any} Arguments to the function call. . Typically a {string} or {any[]} */
	args = [ "args", "value", "or", "array" ]
	// The following are not always needed to be defined,
	// the form for these is: 
	// "expect<pluginID>" - true if plugin is expected to work on this test
	// "expected<pluginID>" - any value, representing the expected value for the test
	/** @type {boolean} Is there an expected return value from running this test case? */
	expectReturnValue = true
	/** @type {any} The expected return value, as verbatim as possible. */
	expectedReturnValue = "expectedReturn"
	/** @type {boolean} Is there exact expected console output from running this test case? */
	expectConsoleOutput = true
	/** @type {string} the exact expected console output from running this test case, verbatim. */
	expectedConsoleOutput = "expected console output"
	/** @type {number} Override of plugin's distance threshold for this test case. Distance is expected in range [0-infinity) with 0 being perfect. */
	thresholdDistanceConsoleOutput = 1
	/** @type {boolean} Is there expected drawing from running this test case? */
	expectDrawing = false
	/** @type {string} The expected drawing function to compare against. */
	expectedDrawing = null
	/** @type {number} Override of plugin's accuracy for this test case Accuracy is expected in range [0-100] with 100 being perfect. */
	thresholdAccuracyDrawing = 99
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
	/** @type {string} Verbatim code to run for testing */
	TestCode = "placeholder(args[0], args[1], args[2]);"
	/** @type {boolean?} Should this lesson's test cases always be opened? */
	AlwaysOpen = true
}