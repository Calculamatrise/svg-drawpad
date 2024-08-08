import Tool from "./Tool.js";

export default class extends Tool {
	active = false;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	press() {
		if (this.active) return;
		this.active = true,
		this.element.remove(),
		this.canvas.layers.selected.base.appendChild(this.element.cloneNode())
	}

	stroke() {
		// make sure it works without having to press down.
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.style.setProperty('fill', this.canvas.fill ? this.canvas.primary : '#FFFFFF00'),
		this.element.setAttribute('x', position.x),
		this.element.setAttribute('y', position.y),
		this.canvas.layers.selected.base.appendChild(this.element)
	}

	clip() {
		if (this.active) {
			this.active = false;
			return;
		}

		// add event listener to type the actual text.
	}

	recordKeys(event) {
		this.element.innerText += event.key
	}
}