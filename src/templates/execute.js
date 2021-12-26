class Execute extends Template {
	draw(data) {
		const { Category, LessonText, Lesson } = data.Content;
		return <div className="col s12 row rowfix">
			<div className="col s12 row rowfix">
				<div className="col s2"></div>
				<button id="prev" className="col blue-grey s4 teensy btn bb waves-effect"> &lt;-- Prev</button>
				<button id="next" className="col blue-grey s4 teensy btn bb waves-effect">Next --&gt; </button>
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
			<div className="col s6 card large blue-grey darken-2">
				<h5> Test Cases & Output : </h5>
				<ul id="output" className="black-text collapsible expandable"></ul>
			</div>	
		</div>
	}
}

TEMPLATES["Execute"] = new Execute();	