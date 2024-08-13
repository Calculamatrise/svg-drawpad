import Curve from "./Curve.js";

export default class extends Curve {
	control = null;
	precise = false;
	stage = 0;
	stroke() {
		let position = this.mouse.position.toCanvas(this.canvas);
		if (this.active) {
			const points = [];
			if (this.precise) {
				// const midpoint = {
				// 	x: ((this.control || this.anchorA).x + this.anchorB.x) / 2,
				// 	y: ((this.control || this.anchorA).y + this.anchorB.y) / 2
				// };
				let midpoint = {
					x: (this.anchorA.x + this.anchorB.x) / 2,
					y: (this.anchorA.y + this.anchorB.y) / 2
				};
				if (this.control) {
					midpoint = {
						x: (this.anchorA.x + this.control.x + this.anchorB.x) / 3,
						y: (this.anchorA.y + this.control.y + this.anchorB.y) / 3
					}
				}
				position = {
					x: position.x + (position.x - midpoint.x),
					y: position.y + (position.y - midpoint.y)
				};
			}
			const length = (Math.sqrt((this.anchorB.x - position.x) ** 2 + (this.anchorB.y - position.y) ** 2) + Math.sqrt((position.x - (this.control || position).x) ** 2 + (position.y - (this.control || position).y) ** 2) + Math.sqrt(((this.control || position).x - this.anchorA.x) ** 2 + ((this.control || position).y - this.anchorA.y) ** 2)) / 3;
			for (let i = 0; i < length; i += this.segmentLength) {
				points.push(this.constructor.bezier(i / length, this.anchorA, this.control || position, position, this.anchorB))
			}

			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${points.map(point => point.join(',')).join(' ')} ${this.anchorB.x},${this.anchorB.y}`);
			return;
		} else if (this.mouse.down && !this.mouse.isAlternate) {
			this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${position.x},${position.y}`);
		}
	}

	clip() {
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		if (this.active && this.stage > 1) {
			this.stage = +(this.active = false);
			this.anchorA = null;
			this.anchorB = null;
			this.control = null;
			this.element.remove();

			const toolSize = this.size;
			const temp = this.element.cloneNode();
			Object.defineProperty(temp, 'erase', {
				value(event) {
					const points = this.getAttribute('points').split(/\s+/g).map(function (point) {
						const [x, y] = point.split(',').map(value => +value);
						return {
							x, y
						}
					});
					return !!points.find((point, index, points) => {
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

						return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue('stroke-width') / 2 <= toolSize && !this.remove();
					})
				},
				writable: true
			}),
			this.canvas.layers.selected.push(temp),
			this.canvas.events.push({
				action: 'add',
				value: temp
			});
			return;
		} else if (this.active && this.stage === 1) {
			let position = this.mouse.position.toCanvas(this.canvas);
			if (this.precise) {
				const midpoint = {
					x: (this.anchorA.x + this.anchorB.x) / 2,
					y: (this.anchorA.y + this.anchorB.y) / 2
				};
				position = {
					x: position.x + (position.x - midpoint.x),
					y: position.y + (position.y - midpoint.y)
				};
			}
			this.control = position,
			this.stage++;
			return;
		} else if (old.x === position.x && old.y === position.y) {
			return this.element.remove();
		}

		this.stage++,
		this.active = true,
		this.anchorB = this.mouse.position.toCanvas(this.canvas),
		this.element.setAttribute('points', `${this.anchorA.x},${this.anchorA.y} ${this.anchorB.x},${this.anchorB.y}`)
	}

	static bezier(t, p0, p1, p2, p3) {
		let cX = 3 * (p1.x - p0.x);
		let bX = 3 * (p2.x - p1.x) - cX;
		let cY = 3 * (p1.y - p0.y);
		let bY = 3 * (p2.y - p1.y) - cY;
		return [
			((p3.x - p0.x - cX - bX) * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x,
			((p3.y - p0.y - cY - bY) * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y
		]
	}
}