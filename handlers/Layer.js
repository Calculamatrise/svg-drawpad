import Layer from "../utils/Layer.js";

export default class {
	get selected() {
		return this.cache.find(({ element }) => element.classList.contains('selected')) ?? this.get(0);
	}

	cache = []
	constructor(parent) {
		this.canvas = parent;
	}

	create() {
		for (const layer of this.cache) {
			layer.element.classList.remove('selected');
		}

		const layer = new Layer(this);
		this.cache.push(layer);
		return layer;
	}

	get(layerId) {
		return this.cache.find(({ id }) => id === parseInt(layerId));
	}

	has(layerId) {
		return !!this.get(layerId);
	}

	insert(layer, newIndex) {
		this.cache.splice(newIndex - 1, 0, layer);
		const hasBefore = this.has(newIndex - 1);
		const adjacent = hasBefore ? this.get(newIndex - 1) : this.get(newIndex + 1);
		adjacent.element[hasBefore ? 'after' : 'before'](layer.element);
		this.cache.forEach((layer, index) => {
			layer.selector.value = index + 1;
			layer.element.classList[layer.id == newIndex ? 'add' : 'remove']('selected');
		});

		return this;
	}

	remove(layer) {
		const spliceIndex = this.cache.indexOf(layer);
		this.cache.splice(spliceIndex, 1);
		this.cache.forEach((layer, index) => {
			layer.selector.value = index + 1;
			layer.element.classList[layer.id == Math.min(spliceIndex + 1, this.cache.length) ? 'add' : 'remove']('selected');
		});

		return layer;
	}

	select(id) {
		for (const layer of this.cache) {
			layer.element.classList[layer.id == id ? 'add' : 'remove']('selected');
		}

		this.selected.selector.focus();
		this.canvas.alert('Layer ' + id);
	}

	close() {
		for (const layer of this.cache.splice(0)) {
			layer.remove();
		}
	}

	static createElement(type, options = {}) {
		const callback = arguments[arguments.length - 1];
		const element = document.createElement(type);
		if ('innerText' in options) {
			element.innerText = options.innerText;
			delete options.innerText;
		}

		for (const attribute in options) {
			if (typeof options[attribute] == 'object') {
				if (options[attribute] instanceof Array) {
					if (/^children$/i.test(attribute)) {
						element.append(...options[attribute]);
					} else if (/^on/i.test(attribute)) {
						for (const listener of options[attribute]) {
							element.addEventListener(attribute.slice(2), listener);
						}
					}
				} else if (/^style$/i.test(attribute)) {
					Object.assign(element[attribute.toLowerCase()], options[attribute]);
				}

				delete options[attribute];
			}
		}

		Object.assign(element, options);
		return typeof callback == 'function' && callback(element), element;
	}
}