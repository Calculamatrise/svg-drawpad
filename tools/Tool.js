export default class {
	get size() {
		return this._size
	}

	set size(size) {
		this._size = size,
		this.reset(),
		this.parent.canvas.alert(this.parent.canvas.tools._selected.charAt(0).toUpperCase() + this.parent.canvas.tools._selected.slice(1) + " size - " + this.size)
	}

	_size = null;
	active = false;
	constructor(parent) {
		Object.defineProperty(this, 'parent', { value: parent || null, writable: true }),
		Object.defineProperty(this, 'canvas', { value: parent.canvas || null, writable: true }),
		Object.defineProperty(this, 'mouse', { value: parent.canvas.mouse || null, writable: true }),
		Object.defineProperty(this, '_size', { enumerable: false })
	}

	press() {}
	reset() {}
	stroke() {}
	clip() {}
	close() {
		this.active = false
	}

	static createElementNS(element, properties = {}) {
		if (typeof element != 'string' || element === void 0) {
			throw new Error("Invalid element! What were you thinking?");
		} else if (typeof properties !== "object" || properties === void 0) {
			throw new Error("Invalid property object! What were you thinking?");
		}

		element = document.createElementNS("http://www.w3.org/2000/svg", element);
		for (const property in properties) {
			if (typeof properties[property] == 'function') {
				throw new Error("Haven't gotten to this yet.");
			} else if (property.toLowerCase() === 'style' && typeof properties[property] == 'object') {
				for (const style in properties[property]) {
					element.style.setProperty(style, properties[property][style]);
				}

				continue;
			}

			element.setAttribute(property, properties[property]);
		}

		return element
	}
}