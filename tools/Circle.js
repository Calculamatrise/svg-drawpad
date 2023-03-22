import Tool from "./Tool.js";

export default class extends Tool {
	_size = 4;
	segmentLength = 1;
	element = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
	get polyline() {
		const temp = document.createElementNS("http://www.w3.org/2000/svg", 'polyline');
		temp.style.setProperty('stroke', this.canvas.primary);
		temp.style.setProperty('stroke-width', this.size);
		temp.erase = function (event) {
			const points = this.getAttribute('points').split(',').map(function (point) {
				const xAndY = point.split(/\s+/g);
				return {
					x: parseInt(xAndY[0]),
					y: parseInt(xAndY[1])
				}
			});

			return !!points.find((point, index, points) => {
				if (!points[index - 1]) {
					return false;
				}

				let vector = {
					x: (parseInt(points[index - 1].x) - window.canvas.viewBox.x) - (parseInt(point.x) - window.canvas.viewBox.x),
					y: (parseInt(points[index - 1].y) - window.canvas.viewBox.y) - (parseInt(point.y) - window.canvas.viewBox.y)
				}

				let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
				let b = (event.offsetX - (parseInt(point.x) - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (parseInt(point.y) - window.canvas.viewBox.y)) * (vector.y / len);
				const v = {
					x: 0,
					y: 0
				}

				if (b <= 0) {
					v.x = parseInt(point.x) - window.canvas.viewBox.x;
					v.y = parseInt(point.y) - window.canvas.viewBox.y;
				} else if (b >= len) {
					v.x = parseInt(points[index - 1].x) - window.canvas.viewBox.x;
					v.y = parseInt(points[index - 1].y) - window.canvas.viewBox.y;
				} else {
					v.x = (parseInt(point.x) - window.canvas.viewBox.x) + vector.x / len * b;
					v.y = (parseInt(point.y) - window.canvas.viewBox.y) + vector.y / len * b;
				}

				const res = {
					x: event.offsetX - v.x,
					y: event.offsetY - v.y
				}

				len = Math.sqrt(res.x ** 2 + res.y ** 2);
				if (len <= window.canvas.tool.size) {
					this.remove();
					return true;
				}

				return false;
			});
		}

		const points = []
		const old = this.mouse.old.toCanvas(this.canvas);
		for (let i = 0; i <= 360; i += this.segmentLength) {
			points.push([
				old.x + this.radius * Math.cos(i * Math.PI / 180),
				old.y + this.radius * Math.sin(i * Math.PI / 180)
			]);
		}

		temp.setAttribute('points', points.map(point => point.join(',')).join(' '));
		return temp;
	}

	get lines() {
		const lines = [];
		const old = this.mouse.old.toCanvas(this.canvas);
		for (let i = 0; i <= 360; i += this.segmentLength) {
			const temp = document.createElementNS("http://www.w3.org/2000/svg", 'line');
			temp.style.setProperty('stroke', this.canvas.primary);
			temp.style.setProperty('stroke-width', this.size);
			temp.setAttribute('x1', old.x + this.radius * Math.cos(i * Math.PI / 180));
			temp.setAttribute('y1', old.y + this.radius * Math.sin(i * Math.PI / 180));
			temp.setAttribute('x2', old.x + this.radius * Math.cos((i + this.segmentLength) * Math.PI / 180));
			temp.setAttribute('y2', old.y + this.radius * Math.sin((i + this.segmentLength) * Math.PI / 180));
			temp.erase = function (event) {
				let vector = {
					x: (+this.getAttribute('x2') - window.canvas.viewBox.x) - (+this.getAttribute('x1') - window.canvas.viewBox.x),
					y: (+this.getAttribute('y2') - window.canvas.viewBox.y) - (+this.getAttribute('y1') - window.canvas.viewBox.y)
				}

				let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
				let b = (event.offsetX - (this.getAttribute('x1') - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (this.getAttribute('y1') - window.canvas.viewBox.y)) * (vector.y / len);
				if (b >= len) {
					vector.x = event.offsetX - (this.getAttribute('x2') - window.canvas.viewBox.x);
					vector.y = event.offsetY - (this.getAttribute('y2') - window.canvas.viewBox.y);
				} else {
					let { x, y } = window.structuredClone(vector);
					vector.x = event.offsetX - (this.getAttribute('x1') - window.canvas.viewBox.x);
					vector.y = event.offsetY - (this.getAttribute('y1') - window.canvas.viewBox.y);
					if (b > 0) {
						vector.x -= x / len * b;
						vector.y -= y / len * b;
					}
				}

				len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
				return len - +this.style.getPropertyValue("stroke-width") / 2 <= window.canvas.tool.size && !this.remove();
			}

			lines.push(temp);
		}

		return lines;
	}

	get radius() {
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		return Math.sqrt((position.x - old.x) ** 2 + (position.y - old.y) ** 2);
	}

	init() {
		this.element.style.setProperty('stroke', this.canvas.primary);
		this.element.style.setProperty('fill', this.canvas.fill ? this.canvas.primary : '#FFFFFF00');
		this.element.style.setProperty('stroke-width', this.size);
		this.element.setAttribute('r', this.radius);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x);
		this.element.setAttribute('cy', position.y);
	}

	press() {
		this.element.style.setProperty('stroke', this.canvas.primary);
		this.element.style.setProperty('fill', this.canvas.fill ? this.canvas.primary : '#FFFFFF00');
		this.element.style.setProperty('stroke-width', this.size);
		const position = this.mouse.position.toCanvas(this.canvas);
		this.element.setAttribute('cx', position.x);
		this.element.setAttribute('cy', position.y);
		this.element.setAttribute('r', 1);
		this.canvas.layer.base.appendChild(this.element);
	}

	stroke() {
		this.element.setAttribute('r', this.radius);
	}

	clip() {
		this.element.remove();
		const old = this.mouse.old.toCanvas(this.canvas);
		const position = this.mouse.position.toCanvas(this.canvas);
		if (old.x === position.x && old.y === position.y) {
			return;
		}

		const circle = this.element.cloneNode();
		circle.erase = function (event) {
			let vector = {
				x: this.getAttribute('cx') - window.canvas.viewBox.x - event.offsetX,
				y: this.getAttribute('cy') - window.canvas.viewBox.y - event.offsetY
			}

			let len = Math.abs(Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.getAttribute('r'));
			return len - this.style.getPropertyValue('stroke-width') / 2 <= window.canvas.tool.size && (window.canvas.tool.size <= len + this.style.getPropertyValue('stroke-width') / 2 || this.getAttribute("r") < window.canvas.tool.size) && !this.remove();
		}

		this.canvas.layer.push(circle);
		this.canvas.events.push({
			action: "add",
			value: circle
		});
	}
}