
class Browse extends Template {
	draw(data) {
		const inner = [];
		const lang = GLOBALS.LANG;
		for (let cat in data.Categories) {
			const category = data.Categories[cat][lang];
			const lessons = [];
			for (let idx in category) {
				const lesson = category[idx]
				console.log(lesson);
				const catName = cat;
				const loader = ()=>{
					GLOBALS.showLesson(data.Categories[catName][GLOBALS.LANG][idx]);
				}
				lessons.push(<div id="" className="col s12 card blue-grey lighten-1">
					<h5 onClick={loader}><a> {lesson.Content.Lesson} </a></h5>
				</div>);
			}
			inner.push(<div className="col s12 card blue-grey">
				<h3>{cat}</h3>
				<div className="row">
					{lessons}
				</div>
			</div>);
		}
		return <div className="col s12 row rowfix">
			{inner}
		</div>	
	}
}

TEMPLATES["Browse"] = new Browse();