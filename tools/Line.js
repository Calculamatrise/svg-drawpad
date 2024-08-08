import Tool from "./Tool.js";

export default class extends Tool {
	_size = 4;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'line');
	reset() {
		this.element.style.setProperty('stroke-width', this.size)
	}

	press(event) {
		this.active = true,
		this.element.style.setProperty('stroke', this.canvas.primary),
		this.element.style.setProperty('stroke-width', this.size);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('x1', position.x),
		this.element.setAttribute('y1', position.y),
		this.element.setAttribute('x2', position.x),
		this.element.setAttribute('y2', position.y),
		this.canvas.layers.selected.base.appendChild(this.element)
	}

	stroke(event) {
		if (!this.active) return;
		this.element.style.setProperty('stroke-width', this.size);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('x2', position.x),
		this.element.setAttribute('y2', position.y)
	}

	clip(event) {
		if (!this.active) return;
		this.active = false,
		this.element.remove();
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		if (old.x === position.x && old.y === position.y) {
			return;
		}

		const eraser = this.canvas.tools.cache.get('eraser');
		const eraserSize = eraser && eraser.size | 0;
		const line = this.element.cloneNode();
		Object.defineProperty(line, 'erase', {
			value(event) {
				let vector = {
					x: this.getAttribute('x2') - this.getAttribute('x1'),
					y: this.getAttribute('y2') - this.getAttribute('y1')
				}
	
				let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
				let b = (event.offsetX - window.canvas.viewBox.x - this.getAttribute('x1')) * (vector.x / len) + (event.offsetY - window.canvas.viewBox.y - this.getAttribute('y1')) * (vector.y / len);
				if (b >= len) {
					vector.x = this.getAttribute('x2') - event.offsetX - window.canvas.viewBox.x;
					vector.y = this.getAttribute('y2') - event.offsetY - window.canvas.viewBox.y;
				} else {
					let { x, y } = window.structuredClone(vector);
					vector.x = this.getAttribute('x1') - event.offsetX - window.canvas.viewBox.x;
					vector.y = this.getAttribute('y1') - event.offsetY - window.canvas.viewBox.y;
					if (b > 0) {
						vector.x += x / len * b;
						vector.y += y / len * b;
					}
				}
	
				return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue('stroke-width') / 2 < eraserSize && !this.remove()
			},
			writable: true
		}),
		this.canvas.layers.selected.push(line),
		this.canvas.events.push({
			action: 'add',
			value: line
		})
	}

	close() {
		this.active = false,
		this.element.remove()
	}
}