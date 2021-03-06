
let cnt = 0;
let passFailClasses = [ "blue-grey", "green", "red" ];
function passFail(result, key) {
	// Todo: reload these from `localStorage.config` for colorblindness...
	if (result) {
		if (result[key]) { return 1; }
		return 2;
	}
	return 0;
}

function pretty(thing) {
	let str = JSON.stringify(thing);
	if (str === undefined) { str = "undefined"; }
	if (str === null) { str = "null"; }
	if (str === "") { str = "(Empty String)"; }	
	return str;
}

class TestResultCard extends Template {
	
	draw(data) { // ExecutionResult data
		
		const result = data;
		const { test, index, run } = result;
		
		const extras = []
		const chips = []
		
		const insides = []
		
		let outColor = run ? passFailClasses[1] : passFailClasses[0];
		if (!run) {
			insides.push(
				<div className={"col s12 card test lighten-2 " + outColor}>
					Not Run Yet
				</div>
			);
		}
		
		for (let id in PLUGINS) {
			const plugin = PLUGINS[id];
			if (plugin.isExpected(test)) {
				checkMatch(plugin, test, result);
				
				// const checked = check(judge);
				
				const color = passFailClasses[passFail(run?result:null, "matched"+id)];
				// console.log(id, "Color=",color,"judged", judgement);
				if (test["expect"+id]) {
					if (run && !result["matched"+id]) { 
						console.log("failed by plugin", id);
						outColor = passFailClasses[2];
					}
					const judge = plugin.judge(test, result);
					chips.push( 
						<div className={"right chip material-icons lighten-2 "+color}>
							{plugin.chip(test, result, judge)}
						</div>
					);
				}
				// console.log("rendering",id,"with test",test);
				if (!test["expect"+id]) { continue; }
				
				if (run) {
					insides.push(
						<div className={"col s12 card test lighten-2 "+color}>
							<span>Expected {id}: </span>
							<pre>{plugin.display(test, test["expected"+id])}</pre>
							<span>Got:</span>
							<pre>{plugin.display(test, result[id])}</pre>
						</div>
					);
				} else {
					insides.push(
						<div className={"col s12 card test lighten-2 "+color}>
							<span>Expected {id}: </span>
							<pre>{plugin.display(test, test["expected"+id])}</pre>
						</div>
					);
				}
			}
		}
		
		cnt++;
		// console.log("Test args are", test.args);
		let argStr = pretty(test.args);
		
		return <li key={""+cnt.toString()}>
			<div className="collapsible-header card blue-grey test">
				{chips}
				Test case #{index}
				<pre>args={argStr}</pre>
			</div>
			<div className="collapsible-body card row blue-grey test">
				<div className={"col s12 card test "+outColor}>
					{insides}
				</div>
			</div>
			
		</li>
	}
}

TEMPLATES["TestResultCard"] = new TestResultCard();