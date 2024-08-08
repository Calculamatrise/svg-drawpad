import EventEmitter from "../utils/EventEmitter.js";

export default class extends EventEmitter {
	down = false;
	isAlternate = false;
	old = Object.defineProperty({
		x: 0,
		y: 0
	}, 'toCanvas', {
		value(canvas) {
			return {
				x: (this.x + canvas.viewBox.x) / canvas.zoom,
				y: (this.y + canvas.viewBox.y) / canvas.zoom
			}
		},
		writable: true
	});
	position = Object.defineProperty({
		x: 0,
		y: 0
	}, 'toCanvas', {
		value(canvas) {
			return {
				x: (this.x + canvas.viewBox.x) / canvas.zoom,
				y: (this.y + canvas.viewBox.y) / canvas.zoom
			}
		},
		writable: true
	});
	get locked() {
		return document.pointerLockElement === this.canvas
	}

	init(target = document) {
		target.addEventListener('pointerdown', this.pointerdown = this.pointerdown.bind(this, target)),
		target.addEventListener('pointermove', this.move = this.move.bind(this, target), { passive: true }),
		target.addEventListener('pointerup', this.up = this.up.bind(this, target)),
		target.addEventListener('touchcancel', this.touchcancel = this.touchcancel.bind(this, target)),
		target.addEventListener('wheel', this.wheel = this.wheel.bind(this, target), { passive: false }),
		this.close = this.close.bind(this, target)
	}

	pointerdown(target, event) {
		event.preventDefault(),
		layerschkbx.checked = false,
		this.down = true,
		(event.buttons & 1) != 1 && (this.isAlternate = true),
		this.locked || (this.position.x = event.offsetX,
		this.position.y = event.offsetY,
		Object.assign(this.old, this.position),
		target.setPointerCapture(event.pointerId)),
		this.emit('down', event)
	}

	move(target, event) {
		this.position.x = event.offsetX,
		this.position.y = event.offsetY,
		this.emit('move', event)
	}

	up(target, event) {
		if (event.target.id !== 'view') return;
		event.preventDefault();
		this.down = false,
		(event.buttons & 1) != 1 && (this.isAlternate = false),
		this.locked || (target.releasePointerCapture(event.pointerId)),
		this.emit('up', event)
	}

	wheel(target, event) {
		event.preventDefault(),
		event.stopPropagation(),
		this.emit('wheel', event)
	}

	touchcancel(target, event) {
		this.down = false
	}

	close(target) {
		target.removeEventListener('pointerdown', this.pointerdown),
		target.removeEventListener('pointermove', this.move),
		target.removeEventListener('pointerup', this.up),
		target.removeEventListener('touchcancel', this.touchcancel),
		target.removeEventListener('wheel', this.wheel)
	}
}