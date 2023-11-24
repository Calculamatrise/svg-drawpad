import Line from "../tools/Line.js";
import BezierCurve from "../tools/BezierCurve.js";
import Brush from "../tools/Brush.js";
import Curve from "../tools/Curve.js";
import Circle from "../tools/Circle.js";
import Ellipse from "../tools/Ellipse.js";
import Heart from "../tools/Heart.js";
import Rectangle from "../tools/Rectangle.js";
import Text from "../tools/Text.js";
import Eraser from "../tools/Eraser.js";
import Camera from "../tools/Camera.js";
import Select from "../tools/Select.js";

export default class {
	get selected() {
		return this.cache.get(this._selected);
	}

	set selected(toolName) {
		if (!this.cache.has(toolName.toLowerCase())) {
			throw new Error(`Hmm. What's a "${toolName}" tool?`);
		} else if (this._selected === toolName.toLowerCase()) {
			return;
		}

		this.selected.close();
		this._selected = toolName.toLowerCase();
		this.selected.init();

		this.canvas.emit('toolSelected', this._selected, this.selected);
	}

	_selected = 'line';
	cache = new Map();
	constructor(parent) {
		this.canvas = parent;
		this.cache.set('line', new Line(this));
		this.cache.set('beziercurve', new BezierCurve(this));
		this.cache.set('brush', new Brush(this));
		this.cache.set('curve', new Curve(this));
		this.cache.set('circle', new Circle(this));
		this.cache.set('ellipse', new Ellipse(this));
		this.cache.set('heart', new Heart(this));
		this.cache.set('rectangle', new Rectangle(this));
		this.cache.set('text', new Text(this));
		this.cache.set('eraser', new Eraser(this));
		this.cache.set('camera', new Camera(this));
		this.cache.set('select', new Select(this));
	}

	select(toolName) {
		return this.selected = toolName.toLowerCase();
	}

	isSelected(toolName) {
		return toolName.toLowerCase() === this._selected.toLowerCase();
	}
}