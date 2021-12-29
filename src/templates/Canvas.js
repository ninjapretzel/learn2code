
class Canvas extends Template {
	draw(data) { // { id:string, w:number, h:number }
		let { id, w, h } = data;
		if (!w) { w = 100; }
		if (!h) { h = 100; }
		
		return <div id={id+"wrapper"}>
			<canvas id={id} width={w} height={h}>
				
			</canvas>
		</div>
	}
	
	
}
TEMPLATES["Canvas"] = new Canvas();