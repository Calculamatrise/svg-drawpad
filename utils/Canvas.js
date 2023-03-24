import EventEmitter from "./EventEmitter.js";
import EventHandler from "../handlers/Event.js";
import LayerHandler from "../handlers/Layer.js";
import MouseHandler from "../handlers/Mouse.js";
import ToolHandler from "../handlers/Tool.js";

const parser = new DOMParser();
export default class extends EventEmitter {
	alerts = []
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
			this.emit('settingsChange', this.config);
			return true;
		},
		deleteProperty: (...args) => {
			Reflect.deleteProperty(...args);
			localStorage.setItem('svg-drawpad-settings', JSON.stringify(this.config));
			return true;
		}
	});
	events = new EventHandler();
	fill = false;
	layers = new LayerHandler(this);
	mouse = new MouseHandler();
	text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
	tools = new ToolHandler(this);
	zoom = 1;
	constructor(view) {
		super();
		this.view = view;
		const { width, height } = view.getBoundingClientRect();
		this.view.style.setProperty('stroke-linecap', 'round');
		this.view.style.setProperty('stroke-linejoin', 'round');
		this.view.setAttribute('viewBox', `0 0 ${width} ${height}`);

		this.layers.create();
		this.mouse.init(this.view);
		this.mouse.on('down', this.press.bind(this));
		this.mouse.on('move', this.stroke.bind(this));
		this.mouse.on('up', this.clip.bind(this));
		this.mouse.on('wheel', this.wheel.bind(this));
		this.text.style.setProperty('text-anchor', 'middle');

		this.on('settingsChange', this.setColorScheme);
		this.setColorScheme();

		document.addEventListener('keydown', this.keydown.bind(this));
		window.addEventListener('resize', this.resize.bind(this));
	}

	get container() {
		return this.view.parentElement || document.querySelector('#container');
	}

	get primary() {
		if (this.config.randomizeStyle) {
			return `rgb(${Math.ceil(Math.random() * 255)}, ${Math.ceil(Math.random() * 255)}, ${Math.ceil(Math.random() * 255)})`;
		}

		return this.config.styles.primary;
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

	setColorScheme({ theme } = this.config) {
		if (theme == 'dark') {
			document.documentElement.attributeStyleMap.clear();
		} else {
			document.documentElement.style.setProperty('--background', '#EBEBEB');
			document.documentElement.style.setProperty('--hard-background', '#EEEEEE');
			document.documentElement.style.setProperty('--text-color', '#1B1B1B');
		}
	}

	alert(text, timeout) {
		// let label = document.createElementNS("http://www.w3.org/2000/svg", 'text');
		clearTimeout(this.text.timeout);
		this.text.innerHTML = text;
		const { width } = this.text.getBoundingClientRect();
		this.text.setAttribute('x', this.viewBox.width / 2 - width / 2 + this.viewBox.x);
		this.text.setAttribute('y', 25 + this.viewBox.y);
		this.text.setAttribute('fill', '#'.padEnd(7, this.config.theme == 'dark' ? 'FB' : '1B'));
		this.text.timeout = setTimeout(() => this.text.remove(), timeout ?? 2e3);
		this.view.appendChild(this.text);
		// this.alerts.push(label);
		return text;
	}

	import(data) {
		this.close();
		try {
			this.view.innerHTML = parser.parseFromString(data, 'text/xml').querySelector('svg').innerHTML;
			while (true) {
				if ([...document.querySelectorAll('g:not([data-id])')].filter(element => element.parentElement.id === 'view').length < 1) {
					break;
				}

				this.layers.create();
			}

			this.layers.select(this.layers.cache.length);
		} catch (error) {
			console.error(error);
		}
	}

	resize() {
		let { width, height } = this.view.getBoundingClientRect();
		height /= this.zoom;
		width /= this.zoom;
		this.view.setAttribute('viewBox', `${this.viewBox.x + (this.viewBox.width - width) / 2} ${this.viewBox.y + (this.viewBox.height - height) / 2} ${width} ${height}`);
		this.text.style.setProperty('font-size', 16 / this.zoom);
		this.text.setAttribute('x', this.viewBox.width / 2 + this.viewBox.x);
		this.text.setAttribute('y', 25 / this.zoom + this.viewBox.y);
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
		}

		event.ctrlKey && this.tools.select('select');
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

	wheel(event) {
		if (event.ctrlKey) {
			if (event.deltaY < 0) {
				this.zoom = Math.min(this.zoom * window.devicePixelRatio + .25, window.devicePixelRatio * 4);
			} else {
				this.zoom = Math.max(this.zoom / window.devicePixelRatio - .25, window.devicePixelRatio / 5);
			}

			window.dispatchEvent(new Event('resize'));
			return;
		}

		if (event.deltaY > 0 && this.tools.selected.size <= 2) {
			return;
		} else if (event.deltaY < 0 && this.tools.selected.size >= 100) {
			return;
		}

		this.tools.selected.size -= event.deltaY / 100;
	}

	keydown(event) {
		event.preventDefault();
		event.stopPropagation();
		switch (event.key) {
			case 'Escape':
				settingschkbx.checked = !settingschkbx.checked;
				settingschkbx.dispatchEvent(new Event('change'));
				break;

			case '+':
			case '=':
				if (event.ctrlKey || this.tools._selected === 'camera') {
					this.zoom = Math.min(this.zoom * window.devicePixelRatio + .25, window.devicePixelRatio * 4);
					window.dispatchEvent(new Event('resize'));
					this.tools.selected.init();
					break;
				}

				if (this.tools.selected.size < 100) {
					this.tools.selected.size += 1;
				}
				break;

			case '-':
				if (event.ctrlKey || this.tools._selected === 'camera') {
					this.zoom = Math.max(this.zoom / window.devicePixelRatio - .25, window.devicePixelRatio / 5);
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
				if (this.layers.selected.id >= this.layers.cache.length) {
					if (!event.shiftKey) {
						break;
					}

					this.layers.create();
				}

				this.layers.select(this.layers.selected.id + 1);
				break;

			case 'ArrowDown':
				if (this.layers.selected.id > 1) {
					this.layers.select(this.layers.selected.id - 1);
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