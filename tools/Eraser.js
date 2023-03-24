import Tool from "./Tool.js";

// const worker = new Worker('HELPER.js');

export default class extends Tool {
	_size = 20;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
	constructor() {
		super(...arguments);
		this.element.setAttribute('opacity', .8);
		this.element.setAttribute('fill', 'khaki');
	}

	init() {
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x);
		this.element.setAttribute('cy', position.y);
		this.element.setAttribute('r', this.size);
		this.canvas.view.appendChild(this.element);
	}

	press(event) {
		this.canvas.layers.selected.lines.filter(line => !!line.parentElement).forEach(line => {
			if (line.erase(event)) {
				this.canvas.events.push({
					action: 'remove',
					value: line
				});
			}
		});
	}

	stroke(event) {
		// USE A WORKER
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x);
		this.element.setAttribute('cy', position.y);
		if (this.mouse.down && !this.mouse.isAlternate) {
			this.canvas.layers.selected.lines.filter(line => !!line.parentElement).forEach(line => {
				if (line.erase(event)) {
					this.canvas.events.push({
						action: 'remove',
						value: line
					});
				}
			});
		}
	}

	close() {
		this.element.remove();
	}
}