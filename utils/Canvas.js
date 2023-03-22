import EventHandler from "../handlers/Event.js";
import LayerHandler from "../handlers/Layer.js";
import MouseHandler from "../handlers/Mouse.js";
import ToolHandler from "../handlers/Tool.js";

let parser = new DOMParser();
export default class {
	get container() {
		return this.view.parentElement || document.querySelector('#container');
	}

	get fill() {
		return this.#fill;
	}

	set fill(boolean) {
		this.text.setAttribute('fill', boolean ? this.primary : '#ffffff00');
		this.tools.selected.element.setAttribute('fill', boolean ? this.primary : '#ffffff00');
		this.#fill = boolean;
	}

	get layer() {
		return this.layers.get(this.#layer);
	}

	get layerDepth() {
		return this.#layer;
	}

	set layerDepth(layer) {
		this.alert('Layer' + layer);
		this.#layer = layer;
	}

	get primary() {
		if (this.config.randomizeStyle) {
			return `rgb(${Math.ceil(Math.random() * 255)}, ${Math.ceil(Math.random() * 255)}, ${Math.ceil(Math.random() * 255)})`;
		}

		return this.config.styles.primary;
	}

	get tool() {
		return this.tools.selected;
	}

	get viewBox() {
		let viewBox = this.view.getAttribute('viewBox').split(/\s+/g);
		return {
			x: parseFloat(viewBox[0]) || 0,
			y: parseFloat(viewBox[1]) || 0,
			width: parseFloat(viewBox[2]) || window.innerWidth,
			height: parseFloat(viewBox[3]) || window.outerWidth
		}
	}

	set viewBox(value) {
		let viewBox = this.viewBox;
		this.view.setAttribute('viewBox', `${value.x || viewBox.x} ${value.y || viewBox.y} ${value.width || viewBox.width} ${value.height || viewBox.height}`);
	}

	#fill = false;
	#layer = 1;
	alerts = [];
	config = new Proxy(Object.assign({
		randomizeStyle: false,
		styles: {
			primary: '#87Ceeb',
			secondary: '#967bb6'
		},
		theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	}, JSON.parse(localStorage.getItem('svg-drawpad-settings'))), {
		get(target, key) {
			if (typeof target[key] == 'object' && target[key] !== null) {
				return new Proxy(target[key], this);
			}

			return target[key];
		},
		set: (...args) => {
			Reflect.set(...args);
			localStorage.setItem('svg-drawpad-settings', JSON.stringify(this.config));
			return true;
		},
		deleteProperty: (...args) => {
			Reflect.deleteProperty(...args);
			localStorage.setItem('svg-drawpad-settings', JSON.stringify(this.config));
			return true;
		}
	});
	events = new EventHandler();
	layers = new LayerHandler(this);
	mouse = new MouseHandler();
	text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	tools = new ToolHandler(this);
	zoom = 1;
	zoomIncrementValue = 0.5;
	constructor(view) {
		this.view = view;
		let { width, height } = view.getBoundingClientRect();
		this.view.style.setProperty('stroke-linecap', 'round');
		this.view.style.setProperty('stroke-linejoin', 'round');
		this.view.setAttribute('viewBox', `0 0 ${width} ${height}`);

		this.layers.create();
		this.mouse.init(this.view);
		this.mouse.on('down', this.press.bind(this));
		this.mouse.on('move', this.stroke.bind(this));
		this.mouse.on('up', this.clip.bind(this));

		document.addEventListener('keydown', this.keydown.bind(this));
		window.addEventListener('resize', this.resize.bind(this));
	}

	alert(text, timeout) {
		// let label = document.createElementNS("http://www.w3.org/2000/svg", 'text');
		clearTimeout(this.text.timeout);
		this.text.innerHTML = text;
		const { width } = this.text.getBoundingClientRect();
		this.text.setAttribute('x', this.viewBox.width / 2 - width / 2 + this.viewBox.x);
		this.text.setAttribute('y', 25 + this.viewBox.y);
		this.text.setAttribute('fill', '#' + (this.config.theme == 'dark' ? 'fbfbfb' : '1b1b1b'));
		this.text.timeout = setTimeout(() => this.text.remove(), timeout ?? 2e3);
		this.view.appendChild(this.text);
		// this.alerts.push(label);

		return text;
	}

	import(data) {
		this.close();
		try {
			this.view.innerHTML = parser.parseFromString(data, 'text/xml').querySelector('svg').innerHTML;
			let layerId = 1;
			while (true) {
				if ([...document.querySelectorAll('g:not([data-id])')].filter(element => element.parentElement.id === 'view').length < 1) {
					break;
				}

				this.layers.create();
				layerId++;
			}

			this.layerDepth = this.layers.cache.length;
		} catch (error) {
			console.error(error);
		}
	}

	resize(event) {
		let { width, height } = this.view.getBoundingClientRect();
		height *= this.zoom;
		width *= this.zoom;
		this.view.setAttribute('viewBox', `${this.viewBox.x + (this.viewBox.width - width) / 2} ${this.viewBox.y + (this.viewBox.height - height) / 2} ${width} ${height}`);
		// this.view.setAttribute('viewBox', `0 0 ${boundingRect.width} ${boundingRect.height}`);
		const text = this.text.getBoundingClientRect();
		this.text.setAttribute('x', this.viewBox.width / 2 - text.width / 2 + this.viewBox.x);
		this.text.setAttribute('y', 25 + this.viewBox.y);
	}

	undo() {
		const event = this.events.pop();
		if (event) {
			switch (event.action) {
				case 'add':
					event.value.remove();
					break;

				case 'remove':
					this.view.prepend(event.value);
					break;

				case 'move_selected':
					event.data.selected.map(function (line, index) {
						let type = parseInt(line.getAttribute('x')) ? 0 : parseInt(line.getAttribute('x1')) ? 1 : parseInt(line.getAttribute('cx')) ? 2 : parseInt(line.getAttribute('points')) ? 3 : NaN;
						if (isNaN(type)) {
							return;
						}

						switch (type) {
							case 0:
								line.setAttribute('x', event.data.cache[index].getAttribute('x'));
								line.setAttribute('y', event.data.cache[index].getAttribute('y'));
								break;

							case 1:
								line.setAttribute('x1', event.data.cache[index].getAttribute('x1'));
								line.setAttribute('y1', event.data.cache[index].getAttribute('y1'));
								line.setAttribute('x2', event.data.cache[index].getAttribute('x2'));
								line.setAttribute('y2', event.data.cache[index].getAttribute('y2'));
								break;

							case 2:
								line.setAttribute('cx', event.data.cache[index].getAttribute('cx'));
								line.setAttribute('cy', event.data.cache[index].getAttribute('cy'));
								break;

							case 3:
								line.setAttribute('points', event.data.cache[index].getAttribute('points'));
								break;
						}
					});
					break;
			}

			return event;
		}

		return null;
	}

	redo() {
		const event = this.events.cache.pop();
		if (event) {
			switch (event.action) {
				case 'add':
					this.view.prepend(event.value);
					break;

				case 'remove':
					event.value.remove();
					break;

				case 'move_selected':
					event.data.selected.map(function (line, index) {
						let type = parseInt(line.getAttribute('x')) ? 0 : parseInt(line.getAttribute('x1')) ? 1 : parseInt(line.getAttribute('cx')) ? 2 : parseInt(line.getAttribute('points')) ? 3 : NaN;
						if (isNaN(type)) {
							return;
						}

						switch (type) {
							case 0:
								line.setAttribute('x', event.data.secondaryCache[index].getAttribute('x'));
								line.setAttribute('y', event.data.secondaryCache[index].getAttribute('y'));
								break;

							case 1:
								line.setAttribute('x1', event.data.secondaryCache[index].getAttribute('x1'));
								line.setAttribute('y1', event.data.secondaryCache[index].getAttribute('y1'));
								line.setAttribute('x2', event.data.secondaryCache[index].getAttribute('x2'));
								line.setAttribute('y2', event.data.secondaryCache[index].getAttribute('y2'));
								break;

							case 2:
								line.setAttribute('cx', event.data.secondaryCache[index].getAttribute('cx'));
								line.setAttribute('cy', event.data.secondaryCache[index].getAttribute('cy'));
								break;

							case 3:
								line.setAttribute('points', event.data.secondaryCache[index].getAttribute('points'));
								break;
						}
					});
					break;
			}

			return event;
		}

		return null;
	}

	press(event) {
		if (event.button === 1) {
			let arr = Array.from(this.tools.cache.keys());
			let index = (arr.indexOf(this.tools._selected) ?? -1) + 1;
			let select = arr[index >= arr.length ? 0 : index];
			return void this.tools.select(select);
		} else if (event.button === 2 || this.mouse.isAlternate) {
			return;
		} else if (event.shiftKey) {
			return void this.alert('Camera');
		}

		if (event.ctrlKey) {
			this.tools.select('select');
		}

		this.tools.selected.press(event);
	}

	stroke(event) {
		if (this.mouse.down && !this.mouse.isAlternate) {
			if (event.shiftKey) {
				this.tools.cache.get('camera').stroke(event);
				return;
			}

			this.tools.selected.stroke(event);
		}

		if (this.tools._selected.match(/^eraser|(bezier)?curve$/gi)) {
			this.tools.selected.stroke(event);
		}
	}

	clip(event) {
		!this.mouse.isAlternate && !event.shiftKey && this.tools.selected.clip(event);
	}

	keydown(event) {
		event.preventDefault();
		event.stopPropagation();
		switch (event.key) {
			case 'Escape':
				if (layers.style.display !== 'none') {
					layers.style.setProperty('display', 'none');
					break;
				}

				let settings = document.querySelector('#settings');
				if (settings === null) {
					break;
				}

				settings.style.setProperty('display', settings.style.display === 'flex' ? 'none' : 'flex');
				break;

			case '+':
			case '=':
				if (this.tools._selected === 'camera' || event.ctrlKey) {
					if (this.zoom <= 1) {
						break;
					}

					this.zoom -= this.zoomIncrementValue;
					window.dispatchEvent(new Event('resize'));
					this.tools.selected.init();
					break;
				}

				if (this.tools.selected.size < 100) {
					this.tools.selected.size += 1;
				}
				break;

			case "-":
				if (this.tools._selected === 'camera' || event.ctrlKey) {
					if (this.zoom >= 10) {
						break;
					}

					this.zoom += this.zoomIncrementValue;
					window.dispatchEvent(new Event('resize'));
					this.tools.selected.init();
					break;
				}

				if (this.tools.selected.size > 2) {
					this.tools.selected.size -= 1;
				}
				break;

			case '0':
				this.tools.select('camera');
				break;

			case '1':
				this.tools.select('line');
				break;

			case '2':
				this.tools.select('brush');
				break;

			case '3':
				this.tools.select('circle');
				break;

			case '4':
				this.tools.select('rectangle');
				break;

			case '5':
				this.tools.select('eraser');
				break;

			case 'f':
				this.fill = !this.fill;
				break;

			case 'ArrowUp':
				if (this.layerDepth >= this.layers.cache.length) {
					if (!event.shiftKey) {
						break;
					}

					this.layers.create();
				}

				this.layerDepth = this.layerDepth + 1;
				break;

			case 'ArrowDown':
				if (this.layerDepth > 1) {
					this.layerDepth = this.layerDepth - 1;
				}
				break;

			case 'z':
				this.undo();
				break;

			case 'x':
				this.redo();
				break;

			case 'c':
				if (this.tools._selected === 'select' && event.ctrlKey) {
					this.tools.selected.copy();
				}
				break;

			case 'v':
				if (this.tools._selected === 'select' && event.ctrlKey) {
					this.tools.selected.paste();
				}
				break;
		}
	}

	toString() {
		return this.view.outerHTML;
	}

	close() {
		this.layers.close();
		this.mouse.close();
		this.events.close();
	}
}