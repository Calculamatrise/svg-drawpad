import EventEmitter from "../utils/EventEmitter.js";

export default class extends EventEmitter {
	down = false;
	pointA = {
		x: -50,
		y: -50
	}
	pointB = {
		x: -50,
		y: -50
	}
	real = {
		x: -50,
		y: -50
	}
	constructor(parent) {
		super();
		this.parent = parent;
	}

	get isAlternate() {
		return this.down && (event.buttons & 1) != 1;
	}

	get locked() {
		return document.pointerLockElement === this.canvas;
	}

	get position() {
		return this.getPosition({
			offsetX: this.real.x,
			offsetY: this.real.y
		});
	}

	getPosition(event = event) {
		return {
			x: ((event.offsetX * this.parent.zoom) + this.parent.viewBox.x),
			y: ((event.offsetY * this.parent.zoom) + this.parent.viewBox.y)
		}
	}

	init() {
		document.addEventListener('pointerdown', this.pointerdown = this.pointerdown.bind(this));
		document.addEventListener('pointermove', this.move = this.move.bind(this));
		document.addEventListener('pointerup', this.up = this.up.bind(this));
		document.addEventListener('touchcancel', this.touchcancel = this.touchcancel.bind(this));
		document.addEventListener('wheel', this.wheel = this.wheel.bind(this), { passive: false });
	}

	pointerdown(event) {
		event.preventDefault();
		if (event.target.id !== 'container') return;
		if (layers.style.display !== 'none') {
			layers.style.display = 'none';
		}

		this.down = true;
		if (!this.locked) {
			this.pointA = this.getPosition(event);
			this.real = {
				x: event.offsetX,
				y: event.offsetY
			}

			this.parent.view.setPointerCapture(event.pointerId);
		}

		return this.emit('down', event);
	}

	move(event) {
		event.preventDefault();
		this.real = {
			x: event.offsetX,
			y: event.offsetY
		}

		return this.emit('move', event);
	}

	up(event) {
		event.preventDefault();
		if (event.target.id !== 'view') return;
		this.down = false;
		if (!this.locked) {
			this.pointB = this.getPosition(event);
			this.parent.view.releasePointerCapture(event.pointerId);
		}

		return this.emit('up', event);
	}

	wheel(event) {
		event.preventDefault();
		event.stopPropagation();
		if (event.ctrlKey) {
			if (event.deltaY < 0) {
				if (this.parent.zoom > 1) {
					this.parent.zoom -= this.parent.zoomIncrementValue;
				}
			} else if (this.parent.zoom < 10) {
				this.parent.zoom += this.parent.zoomIncrementValue;
			}

			window.dispatchEvent(new Event('resize'));
			return;
		}

		if (event.deltaY > 0 && this.parent.tool.size <= 2) {
			return;
		} else if (event.deltaY < 0 && this.parent.tool.size >= 100) {
			return;
		}

		this.parent.tool.size -= event.deltaY / 100;
		// const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--size"));
		// if (event.deltaY > 0 && zoom >= 100 || event.deltaY < 0 && zoom < 1) {
		// 	return;
		// }

		// document.documentElement.style.setProperty("--size", zoom + event.deltaY / 1000);
	}

	touchcancel(event) {
		this.down = false;
	}

	close() {
		document.removeEventListener('pointerdown', this.pointerdown);
		document.removeEventListener('pointermove', this.move);
		document.removeEventListener('pointerup', this.up);
		document.removeEventListener('touchcancel', this.touchcancel);
		document.removeEventListener('wheel', this.wheel);
	}
}