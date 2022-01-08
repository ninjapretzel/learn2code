
class Browse extends Template {
	draw(data) {
		const inner = [];
		const lang = GLOBALS.LANG;
		for (let cat in data.Categories) {
			const category = data.Categories[cat][lang];
			const lessons = [];
			let i = 0;
			for (let idx in category) {
				i++;
				const lesson = category[idx]
				console.log(lesson);
				const catName = cat;
				const loader = ()=>{
					GLOBALS.showLesson(data.Categories[catName][GLOBALS.LANG][idx]);
				}
				lessons.push(<div id="" className="col s12 card blue-grey lighten-1">
					<h5 onClick={loader}>{i}. {lesson.Content.Lesson} </h5>
				</div>);
			}
			inner.push(<div className="col s12 card blue-grey">
				<h3>Category: {cat}</h3>
				<div className="row">
					{lessons}
				</div>
			</div>);
		}
		return <div className="col s12 row rowfix">
			<div className="col s12"><h6>Click a lesson name to load it</h6></div>
			{inner}
		</div>	
	}
}

TEMPLATES["Browse"] = new Browse();
