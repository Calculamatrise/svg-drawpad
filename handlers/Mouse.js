import EventEmitter from "../utils/EventEmitter.js";

export default class extends EventEmitter {
	down = false;
	position = {
		x: 0,
		y: 0,
		toCanvas(canvas) {
			return {
				x: (this.x + canvas.viewBox.x) / canvas.zoom,
				y: (this.y + canvas.viewBox.y) / canvas.zoom
			}
		}
	}
	old = Object.assign({}, this.position);
	get isAlternate() {
		return this.down && (event.buttons & 1) != 1;
	}

	get locked() {
		return document.pointerLockElement === this.canvas;
	}

	init(target = document) {
		target.addEventListener('pointerdown', this.pointerdown = this.pointerdown.bind(this, target));
		target.addEventListener('pointermove', this.move = this.move.bind(this, target));
		target.addEventListener('pointerup', this.up = this.up.bind(this, target));
		target.addEventListener('touchcancel', this.touchcancel = this.touchcancel.bind(this, target));
		target.addEventListener('wheel', this.wheel = this.wheel.bind(this, target), { passive: false });
		this.close = this.close.bind(this, target);
	}

	pointerdown(target, event) {
		event.preventDefault();
		layers.style.display !== 'none' && layers.style.setProperty('display', 'none');
		this.down = true;
		this.locked || (this.position.x = event.offsetX,
		this.position.y = event.offsetY,
		this.old = Object.assign({}, this.position),
		target.setPointerCapture(event.pointerId));
		this.emit('down', event);
	}

	move(target, event) {
		event.preventDefault();
		this.position.x = event.offsetX;
		this.position.y = event.offsetY;
		this.emit('move', event);
	}

	up(target, event) {
		event.preventDefault();
		if (event.target.id !== 'view') return;
		this.down = false;
		this.locked || (target.releasePointerCapture(event.pointerId));
		this.emit('up', event);
	}

	wheel(target, event) {
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

	touchcancel(target, event) {
		this.down = false;
	}

	close(target) {
		target.removeEventListener('pointerdown', this.pointerdown);
		target.removeEventListener('pointermove', this.move);
		target.removeEventListener('pointerup', this.up);
		target.removeEventListener('touchcancel', this.touchcancel);
		target.removeEventListener('wheel', this.wheel);
	}
}