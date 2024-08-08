import Tool from "./Tool.js";

export default class extends Tool {
	_size = 4;
	active = false;
	anchorA = null;
	anchorB = null;
	segmentLength = 1;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
	reset() {
		this.element.style.setProperty('stroke-width', this.size)
	}

	press() {
		if (this.active) return;
		this.anchorA = this.mouse.position.toCanvas(this.canvas),
		this.element.style.setProperty('stroke', this.canvas.primary),
		this.element.style.setProperty('stroke-width', this.size),
		this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y}`),
		this.canvas.layers.selected.base.appendChild(this.element)
	}

	stroke() {
		const position = this.mouse.position.toCanvas(this.canvas);
		if (this.active) {
			const points = [];
			const length = (Math.sqrt((this.anchorB.x - position.x) ** 2 + (this.anchorB.y - position.y) ** 2) + Math.sqrt((position.x - this.anchorA.x) ** 2 + (position.y - this.anchorA.y) ** 2)) / 2;
			for (let i = 0; i < length; i += this.segmentLength) {
				let n = i / length;
				points.push([
					(1 - n) ** 2 * this.anchorA.x + 2 * (1 - n) * n * position.x + n ** 2 * this.anchorB.x,
					(1 - n) ** 2 * this.anchorA.y + 2 * (1 - n) * n * position.y + n ** 2 * this.anchorB.y
				]);
			}

			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${points.map(point => point.join(',')).join(' ')} ${this.anchorB.x},${this.anchorB.y}`);
		} else if (this.mouse.down && !this.mouse.isAlternate) {
			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${position.x},${position.y}`)
		}
	}

	clip() {
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		if (this.active) {
			this.active = false;
			this.anchorA = null;
			this.anchorB = null;
			this.element.remove();

			// const canvas = this.canvas;
			const eraser = this.canvas.tools.cache.get('eraser');
			const eraserSize = eraser && eraser.size | 0;
			const temp = this.element.cloneNode();
			Object.defineProperty(temp, 'erase', {
				value(event) {
					const points = this.getAttribute('points').split(/\s+/g).map(point => {
						// Object.fromEntries
						const [x, y] = point.split(',').map(value => +value);
						return { x, y }
					});
					return Boolean(points.find((point, index, points) => {
						if (!points[index - 1]) {
							return false;
						}

						let vector = {
							x: points[index - 1].x - window.canvas.viewBox.x - point.x - window.canvas.viewBox.x,
							y: points[index - 1].y - window.canvas.viewBox.y - point.y - window.canvas.viewBox.y
						}

						let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
						let b = -(point.x - window.canvas.viewBox.x - event.offsetX) * (vector.x / len) - (point.y - window.canvas.viewBox.y - event.offsetY) * (vector.y / len);
						if (b >= len) {
							vector.x = points[index - 1].x - window.canvas.viewBox.x - event.offsetX;
							vector.y = points[index - 1].y - window.canvas.viewBox.y - event.offsetY;
						} else {
							let { x, y } = window.structuredClone(vector);
							vector.x = point.x - window.canvas.viewBox.x - event.offsetX;
							vector.y = point.y - window.canvas.viewBox.y - event.offsetY;
							if (b > 0) {
								vector.x += x / len * b;
								vector.y += y / len * b;
							}
						}

						return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue('stroke-width') / 2 <= eraserSize && !this.remove();
					}))
				},
				writable: true,
			}),
			this.canvas.layers.selected.push(temp),
			this.canvas.events.push({
				action: 'add',
				value: temp
			});
			return;
		} else if (old.x === position.x && old.y === position.y) {
			return this.element.remove();
		}

		this.active = true,
		this.anchorB = this.mouse.position.toCanvas(this.canvas),
		this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${this.anchorB.x},${this.anchorB.y}`)
	}
}