import Tool from "./Tool.js";

// const worker = new Worker('HELPER.js');

export default class extends Tool {
	_size = 20;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
	constructor() {
		super(...arguments);
		this.element.setAttribute('opacity', .8),
		this.element.setAttribute('fill', 'khaki')
	}

	reset() {
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x),
		this.element.setAttribute('cy', position.y),
		this.element.setAttribute('r', this.size),
		this.canvas.view.appendChild(this.element)
	}

	press(event) {
		this.canvas.layers.selected.lines.filter(line => !!line.parentElement && line.erase(event)).forEach(line => {
			this.canvas.events.push({
				action: 'remove',
				value: line
			})
		})
	}

	stroke(event) {
		// USE A WORKER
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x),
		this.element.setAttribute('cy', position.y);
		if (this.mouse.down && !this.mouse.isAlternate) {
			this.press(event)
		}
	}

	close() {
		this.element.remove()
	}
}