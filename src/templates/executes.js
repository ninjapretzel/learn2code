function newliner(text) {
	return text.split("\n").map((value, index) => {
		return (<span idx={index}>{value}<br /></span>)
	});
}

function expects(lesson, plugin) {
	for (let test of lesson.TestCases) {
		if (test["expect"+plugin.id]) { return true; }
	}
	return false;
}

class Execute extends Template {
	draw(data) { // data:Lesson
		let { Category, LessonText, Lesson } = data.Content;
		LessonText = newliner(LessonText)
		const panels = [];
		for (let key in PLUGINS) {
			const plugin = PLUGINS[key];
			if (plugin.isExpected(data)) {
				console.log(plugin.id, "is expected");
				const panel = plugin.panel(data);
				if (panel) { panels.push(panel); }
			}
		}
		
		return <div className="col s12 row rowfix">
			<div className="col s12 row rowfix">
				<div className="col s2"></div>
				{/*
				<button id="prev" className="col blue-grey s4 teensy btn bb waves-effect"> &lt;-- Prev</button>
				<button id="next" className="col blue-grey s4 teensy btn bb waves-effect">Next --&gt; </button>
				 */}
				<div className="col s12">
					<h5><span id="Category">{Category}</span> : <span id="Lesson">{Lesson}</span></h5>
					<div id="LessonText">{LessonText}</div>	
				</div>
			</div>
			<div className="col s6 card large blue-grey darken-2">
				<button id="run" className="teensy btn bb waves-effect right">Run</button>
				<h5> Code Entry : </h5>
				<div id="scriptEntry"></div>
				<div className="row rowfix">
					<div className="col s6 row rowfix">
					</div>
				</div>
			</div>
			{panels}
			<div className="col s6 card large blue-grey darken-2">
				<h5> Test Cases & Output : </h5>
				<ul id="output" className="black-text collapsible expandable"></ul>
			</div>	
		</div>
	}
}

TEMPLATES["Execute"] = new Execute();	