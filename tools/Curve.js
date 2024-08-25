import Tool from "./Tool.js";

export default class extends Tool {
	_size = 4;
	anchorA = null;
	anchorB = null;
	controlPoints = null;
	maxControlPoints = 1;
	precise = true;
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
		let position = this.mouse.position.toCanvas(this.canvas);
		if (this.active) {
			const points = [];
			if (this.precise && this.maxControlPoints <= 1) {
				const midpoint = {
					x: (this.anchorA.x + this.anchorB.x) / 2,
					y: (this.anchorA.y + this.anchorB.y) / 2
				};
				position = {
					x: position.x + (position.x - midpoint.x),
					y: position.y + (position.y - midpoint.y)
				};
			}
			const controlPoints = Array.from(this.controlPoints ?? []);
			controlPoints.length < this.maxControlPoints && controlPoints.push(...Array.from({ length: this.maxControlPoints - controlPoints.length }, () => Object.assign({}, position)));
			const length = (Math.sqrt((this.anchorB.x - position.x) ** 2 + (this.anchorB.y - position.y) ** 2) + controlPoints.reduce((sum, point, i) => (i < 1 || i % 2) ? sum : sum += Math.sqrt((point.x - controlPoints[i - 1].x) ** 2 + (point.y - controlPoints[i - 1].y) ** 2), 0) + Math.sqrt((position.x - this.anchorA.x) ** 2 + (position.y - this.anchorA.y) ** 2)) / (2 + Math.ceil(controlPoints.length / 2));
			// const length = (Math.sqrt((this.anchorB.x - position.x) ** 2 + (this.anchorB.y - position.y) ** 2) + Math.sqrt((position.x - this.anchorA.x) ** 2 + (position.y - this.anchorA.y) ** 2)) / 2;
			for (let i = 0; i < length; i += this.segmentLength) {
				let n = i / length;
				points.push(this.constructor.multiCurve(n, this.anchorA, ...controlPoints, this.anchorB));
			}

			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${points.map(point => point.join(',')).join(' ')} ${this.anchorB.x},${this.anchorB.y}`);
		} else if (this.mouse.down && !this.mouse.isAlternate) {
			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${position.x},${position.y}`)
		}
	}

	clip() {
		let position = this.mouse.position.toCanvas(this.canvas);
		if (this.anchorA.x === position.x && this.anchorA.y === position.y) {
			return this.element.remove();
		} else if (!this.active) {
			this.active = true,
			this.anchorB = position,
			this.maxControlPoints > 1 && (this.controlPoints = []),
			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${this.anchorB.x},${this.anchorB.y}`);
			return;
		} else if (this.maxControlPoints > 1 && this.controlPoints.length + 1 < this.maxControlPoints) {
			if (this.precise && this.maxControlPoints <= 1) {
				const midpoint = {
					x: (this.anchorA.x + this.anchorB.x) / 2,
					y: (this.anchorA.y + this.anchorB.y) / 2
				};
				position = {
					x: position.x + (position.x - midpoint.x),
					y: position.y + (position.y - midpoint.y)
				};
			}
			this.controlPoints.push(position);
			return;
		}

		this.active = false,
		this.anchorA = null,
		this.anchorB = null,
		this.controlPoints = null,
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

					return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue('stroke-width') / 2 <= eraserSize && !this.remove()
				}))
			},
			writable: true,
		}),
		this.canvas.layers.selected.push(temp),
		this.canvas.events.push({
			action: 'add',
			value: temp
		})
	}

	close() {
		this.element.remove()
	}

	static binomialCoefficient(n, k) {
		if (Number.isNaN(n) || Number.isNaN(k)) return NaN;
		if (k < 0 || k > n) return 0;
		if (k === 0 || k === n) return 1;
		if (k === 1 || k === n - 1) return n;
		if (n - k < k) k = n - k;

		let res = n;
		for (let i = 2; i <= k; i++) res *= (n - i + 1) / i;
		return Math.round(res)
	}

	static multiCurve(t, ...points) {
		let p = points.length - 1;
		let p0 = points.shift();
		let pN = points.pop();
		let x = points.reduce((sum, { x }, i) => sum += this.binomialCoefficient(p, i + 1) * (1 - t) ** (points.length - i) * t ** (1 + i) * x, 0);
		let y = points.reduce((sum, { y }, i) => sum += this.binomialCoefficient(p, i + 1) * (1 - t) ** (points.length - i) * t ** (1 + i) * y, 0);
		return [
			(1 - t) ** p * p0.x + x + t ** p * pN.x,
			(1 - t) ** p * p0.y + y + t ** p * pN.y
		]
	}
}