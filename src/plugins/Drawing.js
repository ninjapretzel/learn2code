

const TAU = 2 * Math.PI;
function cap256(v) { return Math.floor(v); }
function clamp(v,min=0,max=1) { return (v < min) ? min : ((v > max) ? max : v); }
function frac(v) { return v-Math.floor(v); }
function abs(v) { return v < 0 ? -v : v; }
function fmod(a,b) { 
	const c = frac(abs(a/b)) * abs(b);
	return (a < 0) ? -c : c 
}
function color(r,g,b) { 
	r = cap256(r); g = cap256(g); b = cap256(b);
	return `rgb(${r},${g},${b})`; 
}
function fcolor (r,g,b) { return color(r*256,g*256,b*256); }
function hsv(h,s,v) {
	h = fmod(h, 1.0);
	if (h < 0) { h += 1.0; }
	if (s == 0) { return fcolor(v,v,v); }
	h *= 6.0;
	const i = Math.floor(h);
	const f = h - i;
	const p = v * (1.0-s);
	const q = v * (1.0-s*f);
	const t = v * (1.0 - s * (1.0-f));
	if (i == 0) { return fcolor(v,t,p); }
	else if (i == 1) { return fcolor(q,v,p); }
	else if (i == 2) { return fcolor(p,v,t); }
	else if (i == 3) { return fcolor(p,q,v); }
	else if (i == 4) { return fcolor(t,p,v); }
	return fcolor(v,p,q);
}
function extractPixels(query) {
	const canvas = $(query)[0];
	if (canvas && canvas.getContext) {
		const ctx = canvas.getContext('2d');
		const img = ctx.getImageData(0,0,canvas.width, canvas.height);
		return img;
	}
	return null;
}
// @HACK unfortunately, GLOBALS is not available here.
// So instead, we'll pass this function through window...
// I really hate passing things through window... 
window.extractPixels = extractPixels;

class DrawingPlugin extends L2CPlugin {
	get id() { return "Drawing"; }
	extract(result) { 
		
		return this.canvas;
	}
	
	panel(data) {
		const mainCanvas = TEMPLATES["Canvas"].draw({id:"mainCanvas"});
		const backCanvas = TEMPLATES["Canvas"].draw({id:"backCanvas"});
		this.backCanvas = backCanvas;
		return <div className="col s6 row rowfix card blue-grey darken-2">
			<div className="canvas-wrapper left">
				Drawing Canvas:
				{mainCanvas}
			</div>
			<div className="canvas-wrapper center">
				Sample:
				{backCanvas}
			</div>
		</div>	
	}
	canvasSetup(target, injected) {
		this.ctx = target.getContext("2d");
		this.ctx.font = "12px Arial";
		this.ctx.fillStyle = this.ctx.strokeStyle = this.pen = "rgb(0,0,0)";
		const w = target.width;
		const h = target.height;
		injected.color = color;
		injected.fcolor = fcolor;
		injected.hsv = hsv;
		injected.rgb = fcolor;
		injected.rgb32 = color;
		injected.setPenColor = (color)=>{
			this.pen = color;
			this.ctx.fillStyle = color;
			this.ctx.strokeStyle = color;
		}
		injected.clear = (color="rgb(255,255,255)")=>{
			const prevPen = this.pen;
			injected.setPenColor(color);
			injected.filledRectangle(w / 2, h / 2, w, h);
			injected.setPenColor(prevPen);
		}
		injected.line = (x1,y1,x2,y2)=>{
			this.ctx.beginPath();
			this.ctx.moveTo(x1,y1);
			this.ctx.lineTo(x2,y2);
			this.ctx.stroke();
		}
		injected.circle = (x,y,r) => {
			this.ctx.beginPath();
			this.ctx.arc(x,y,r,0,TAU);
			this.ctx.stroke();
		}
		injected.filledCircle = (x,y,r) => {
			this.ctx.beginPath();
			this.ctx.arc(x,y,r,0,TAU);
			this.ctx.fill();
		}
		injected.square = (x,y,side) => {
			this.ctx.beginPath();
			this.ctx.rect(x-side/2, y-side/2, side, side);
			this.ctx.stroke();
		}
		injected.filledSquare = (x,y,side) => {
			this.ctx.fillRect(x-side/2, y-side/2, side, side);
		}
		injected.rectangle = (x,y,w,h) => {
			this.ctx.beginPath();
			this.ctx.rect(x-w/2, y-h/2, w, h);
			this.ctx.stroke();
		}
		injected.filledRectangle = (x,y,w,h) => {
			this.ctx.fillRect(x-w/2, y-h/2, w, h);
		}
		injected.text = (x,y,text) => { this.ctx.fillText(text,x,y); }
		injected.clear();
	}
	ready(lesson) {
		this.target = $("#mainCanvas")[0];
		const fn = {}
		this.canvasSetup(this.target, fn);
		fn.clear();
	}
	
	preRun(test, injected, result) {
		this.target = $("#mainCanvas")[0];
		this.canvasSetup(this.target, injected);
		injected.clear();
		
	}
	postRun(test, injected, result) {
		
		
	}
	judge(test, result) {
		if (!result) { return false; }
		if (test["expect"+this.id] && typeof(test.expectedDrawing) === "function") {
			// console.log("Drawing judgement");
			const drawnPixels = extractPixels("#mainCanvas");
			// console.log("Got drawing", drawnPixels);
			const expectedPixels = test.expectedDrawing();
			// console.log("Got expected", expectedPixels);
			if (expectedPixels.width != drawnPixels.width || expectedPixels.height != drawnPixels.height) {
				return { expected:true, accuracy: 0 };	
			}
			const w = drawnPixels.width;
			const h = drawnPixels.height;
			const total = w*h;
			// console.log("got total", total)
			const drawn = drawnPixels.data;
			const expected = expectedPixels.data;
			let cnt = 0;
			for (let x = 0; x < w; x++) {
				for (let y = 0; y < h; y++) {
					const r = x * 4 + y * w * 4;
					const g = r + 1;
					const b = r + 2;
					const d = Math.abs(drawn[r] - expected[r])
							+ Math.abs(drawn[g] - expected[g])
							+ Math.abs(drawn[b] - expected[b]);
					if (d === 0) { cnt++; }
				}
			}
			const output = { expected:true, accuracy: 100 * cnt / total };
			// console.log("Compared", total, "pixels of", w, "x", h);
			// console.log(output);
			
			return output;
			
		}
		return false;
	}
}
registerPlugin(new DrawingPlugin());