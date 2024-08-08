import Tool from "./Tool.js";
import BezierCurve from "./BezierCurve.js";

export default class extends Tool {
	_size = 4;
	color = null;
	segmentLength = 5;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
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

	drawHeart(x, y, width, height) {
		let topCurveHeight = height * 0.3;

		const points = [];
		for (let i = 0; i < 1; i += this.segmentLength / 100) {
			// top left curve
			points.push(BezierCurve.bezier(i, { x, y: y + topCurveHeight },
				{ x, y },
				{ x: x - width, y },
				{ x: x - width, y: y + topCurveHeight }
			));
		}

		for (let i = 0; i < 1; i += this.segmentLength / 100) {
			// bottom left curve
			points.push([
				Math.pow((1 - i), 2) * (x - width) + 2 * (1 - i) * i * (x - width) + Math.pow(i, 2) * x,
				Math.pow((1 - i), 2) * (y + topCurveHeight) + 2 * (1 - i) * i * (y + (height + topCurveHeight) / 2) + Math.pow(i, 2) * (y + height)
			]);

			// style 2 - dripping
			// points.push(BezierCurve.bezier(i, { x: x - width, y: y + topCurveHeight },
			//     { x: x - width, y: y + (height + topCurveHeight) / 2 },
			//     { x, y: y + (height + topCurveHeight) / 2 },
			//     { x, y: y + height }
			// ));
		}

		for (let i = 0; i < 1; i += this.segmentLength / 100) {
			// bottom right curve
			points.push([
				Math.pow((1 - i), 2) * x + 2 * (1 - i) * i * (x + width) + Math.pow(i, 2) * (x + width),
				Math.pow((1 - i), 2) * (y + height) + 2 * (1 - i) * i * (y + (height + topCurveHeight) / 2) + Math.pow(i, 2) * (y + topCurveHeight)
			]);

			// style 2 - dripping
			// points.push(BezierCurve.bezier(i, { x, y: y + height },
			//     { x, y: y + (height + topCurveHeight) / 2 },
			//     { x: x + width, y: y + (height + topCurveHeight) / 2 },
			//     { x: x + width, y: y + topCurveHeight }
			// ));
		}

		for (let i = 0; i < 1; i += this.segmentLength / 100) {
			// top right curve
			points.push(BezierCurve.bezier(i, { x: x + width, y: y + topCurveHeight },
				{ x: x + width, y },
				{ x, y },
				{ x, y: y + topCurveHeight }
			));
		}

		points.push(points[0]);
		return points
	}

	press() {
		this.element.style.setProperty('stroke', this.canvas.primary),
		this.element.style.setProperty('fill', this.canvas.fill ? this.canvas.primary : "#FFFFFF00"),
		this.element.style.setProperty('stroke-width', this.size);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('points', `${position.x},${position.y}`),
		this.canvas.layers.selected.base.appendChild(this.element)
	}

	stroke() {
		this.element.style.setProperty('stroke-width', this.size);
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('points', this.drawHeart(old.x, Math.min(position.y, old.y), this.width, this.height))
	}

	clip() {
		this.element.remove();
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		if (old.x === position.x && old.y === position.y) {
			return;
		}

		const temp = this.element.cloneNode();
		Object.defineProperty(temp, 'erase', {
			value(event) {
				const points = this.getAttribute('points').split(/\s+/g).map(function (point) {
					const [x, y] = point.split(',').map(value => +value);
					return {
						x,
						y
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

					return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue('stroke-width') / 2 <= window.canvas.tools.selected.size && !this.remove()
				});
			},
			writable: true
		});

		this.canvas.layers.selected.push(temp),
		this.canvas.events.push({
			action: 'add',
			value: temp
		})
	}
}