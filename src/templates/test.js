

class TestResultCard extends Template {
	static passFail(result, key) {
		if (result) {
			if (result[key]) { return 1; }
			return 2;
		}
		return 0;
	}
	static passFailColors = [ "blue-grey", "green", "red" ];
	
	draw(data) {
		const { test, result, index } = data;
		
		
		
		const retValChip = (test.expectReturnValue) ? <div className="right chip material-icons lighten-2">keyboard_return</div> : "";
		
		
		return <li>
			<div className="collapsible-header card blue-grey test">
				Test case #{index}
			</div>
			<div className="collapsible-body card row blue-grey test">
				Yeet yaw mah dude
			</div>
			
		</li>
	}
}

TEMPLATES["TestResultCard"] = new TestResultCard();