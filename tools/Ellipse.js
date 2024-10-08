import Tool from "./Tool.js";

export default class extends Tool {
	_size = 4;
	color = null;
	lockAspectRatio = false;
	segmentLength = 5;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'ellipse');
	get current() {
		const lines = [];
		for (let i = 0; i <= 360; i += this.segmentLength) {
			const temp = document.createElementNS("http://www.w3.org/2000/svg", 'line');
			temp.style.setProperty('stroke', this.color),
			temp.style.setProperty('stroke-width', this.size),
			temp.setAttribute('x1', this.x + this.width * Math.cos(i * Math.PI / 180)),
			temp.setAttribute('y1', this.y + this.height * Math.sin(i * Math.PI / 180)),
			temp.setAttribute('x2', this.x + this.width * Math.cos((i + this.segmentLength) * Math.PI / 180)),
			temp.setAttribute('y2', this.y + this.height * Math.sin((i + this.segmentLength) * Math.PI / 180)),
			Object.defineProperty(temp, 'erase', {
				value(event) {
					let vector = {
						x: this.getAttribute('x2') - window.canvas.viewBox.x - this.getAttribute('x1') - window.canvas.viewBox.x,
						y: this.getAttribute('y2') - window.canvas.viewBox.y - this.getAttribute('y1') - window.canvas.viewBox.y
					}

					let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
					let b = (this.getAttribute('x1') - window.canvas.viewBox.x - event.offsetX) * (vector.x / len) + (this.getAttribute('y1') - window.canvas.viewBox.y - event.offsetY) * (vector.y / len);
					if (b >= len) {
						vector.x = this.getAttribute('x2') - window.canvas.viewBox.x - event.offsetX;
						vector.y = this.getAttribute('y2') - window.canvas.viewBox.y - event.offsetY;
					} else {
						let { x, y } = window.structuredClone(vector);
						vector.x = this.getAttribute('x1') - window.canvas.viewBox.x - event.offsetX;
						vector.y = this.getAttribute('y1') - window.canvas.viewBox.y - event.offsetY;
						if (b > 0) {
							vector.x += x / len * b;
							vector.y += y / len * b;
						}
					}

					return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue('stroke-width') / 2 <= window.canvas.tools.selected.size && !this.remove()
				},
				writable: true,
			}),
			lines.push(temp);
		}

		return lines
	}

	get width() {
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		return Math.sqrt((position.x - old.x) ** 2)
	}

	get height() {
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		return Math.sqrt((position.y - old.y) ** 2)
	}

	reset() {
		this.element.style.setProperty('stroke', this.color = this.canvas.primary),
		this.element.style.setProperty('fill', this.canvas.fill ? this.canvas.primary : "#FFFFFF00"),
		this.element.style.setProperty('stroke-width', this.size)
	}

	press() {
		this.element.style.setProperty('stroke', this.color = this.canvas.primary),
		this.element.style.setProperty('fill', this.canvas.fill ? this.canvas.primary : "#FFFFFF00"),
		this.element.style.setProperty('stroke-width', this.size);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x),
		this.element.setAttribute('cy', position.y),
		this.element.setAttribute('rx', 1),
		this.element.setAttribute('ry', 1),
		this.canvas.layers.selected.base.appendChild(this.element)
	}

	stroke() {
		// const points = []
		// for (let i = 0; i <= 360; i += this.segmentLength/*1000 / (this.width / 2 + this.height / 2) / 2 / 10*/) {
		//     points.push([
		//         this.x + this.width * Math.cos(i * Math.PI / 180),
		//         this.y + this.height * Math.sin(i * Math.PI / 180)
		//     ]);
		// }

		this.element.style.setProperty('stroke-width', this.size);
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('rx', Math.sqrt((position.x - old.x) ** 2) || 1),
		this.element.setAttribute('ry', Math.sqrt((position.y - old.y) ** 2) || 1)
	}

	clip() {
		this.element.remove();
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		if (old.x === position.x && old.y === position.y) {
			return;
		}

		// if aspect ratio is 1, create circle
		const temp = this.element.cloneNode();
		Object.defineProperty(temp, 'erase', {
			value(event) {
				let vector = {
					x: this.getAttribute('cx') - window.canvas.viewBox.x - event.offsetX,
					y: this.getAttribute('cy') - window.canvas.viewBox.y - event.offsetY
				}

				return Math.sqrt(vector.x ** 2 / (~~this.getAttribute('rx') + this.style.getPropertyValue('stroke-width') / 2 + window.canvas.tools.selected.size) ** 2 + vector.y ** 2 / (~~this.getAttribute('ry') + this.style.getPropertyValue('stroke-width') / 2 + window.canvas.tools.selected.size) ** 2) <= 1 && (Math.sqrt(vector.x ** 2 / (+this.getAttribute('rx') - this.style.getPropertyValue('stroke-width') / 2 - window.canvas.tools.selected.size) ** 2 + vector.y ** 2 / (+this.getAttribute('ry') - this.style.getPropertyValue('stroke-width') / 2 - window.canvas.tools.selected.size) ** 2) >= 1 || this.getAttribute('rx') < window.canvas.tools.selected.size || this.getAttribute('ry') < window.canvas.tools.selected.size) && !this.remove()
			},
			writable: true
		});

		this.canvas.layers.selected.push(temp),
		this.canvas.events.push({
			action: 'add',
			value: temp
		})
	}

	close() {
		this.element.remove()
	}
}