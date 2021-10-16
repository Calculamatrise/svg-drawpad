import MouseHandler from "./MouseHandler.js";
import EventHandler from "./EventHandler.js";
import LayerManager from "./LayerManager.js";

import ToolHandler from "./ToolHandler.js";

export default class {
	constructor(view) {
		this.view = view;
		this.view.setAttribute("viewBox", `0 0 ${view.width.baseVal.value} ${view.height.baseVal.value}`);

		this.layers.create();

		this.mouse.init();
		this.mouse.on("down", this.mouseDown.bind(this));
		this.mouse.on("move", this.mouseMove.bind(this));
		this.mouse.on("up", this.mouseUp.bind(this));

		window.addEventListener("resize", this.resize.bind(this));

		document.addEventListener("keydown", this.keyDown.bind(this));
	}
	#layer = 1;
	#fill = false;
	#primary = "#87CEEB";
	#secondary = "#967BB6";
	mouse = new MouseHandler(this);
	layers = new LayerManager();
	events = new EventHandler();
	tools = new ToolHandler(this);
	text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	get dark() {
		return JSON.parse(localStorage.getItem("dark")) ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
	}
	get tool() {
		return this.tools.selected;
	}
	get primary() {
		if (JSON.parse(sessionStorage.getItem("randomColors"))) {
			return `rgb(${Math.ceil(Math.random() * 255)}, ${Math.ceil(Math.random() * 255)}, ${Math.ceil(Math.random() * 255)})`;
		}

		return localStorage.getItem("primaryColor") || this.#primary;
	}
	set primary(color) {
		localStorage.setItem("primaryColor", color);

		this.#primary = color;
	}
	get secondary() {
		return localStorage.getItem("secondaryColor") || this.#secondary;
	}
	set secondary(color) {
		localStorage.setItem("secondaryColor", color);

		this.#secondary = color;
	}
	get layerDepth() {
		return this.#layer;
	}
	set layerDepth(layer) {
		clearTimeout(this.text.timeout);

		this.text.innerHTML = "Layer " + layer;
		this.text.setAttribute("x", this.view.width.baseVal.value / 2 + this.viewBox.x - this.text.innerHTML.length * 2.5);
		this.text.setAttribute("y", 25 + this.viewBox.y);
		this.text.setAttribute("fill", this.dark ? "#FBFBFB" : "1B1B1B");
		this.view.appendChild(this.text);

		this.text.timeout = setTimeout(() => {
			this.text.remove();
		}, 2000);

		this.#layer = layer;
	}
	get layer() {
		return this.layers.get(this.#layer);
	}
	get fill() {
		return this.#fill;
	}
	set fill(boolean) {
		this.text.setAttribute("fill", boolean ? this.primary : "#FFFFFF00");
		this.tool.element.setAttribute("fill", boolean ? this.primary : "#FFFFFF00");

		this.#fill = boolean;
	}
	get container() {
		return this.view.parentElement;
	}
	get viewBox() {
		const viewBox = this.view.getAttribute("viewBox").split(/\s+/g);
		return {
			x: parseInt(viewBox[0]),
			y: parseInt(viewBox[1])
		}
	}
	import(data) {
		const layers = data.split(/\u003E/g);
		for (const layer in layers) {
			if (!this.layers.has(parseInt(layer) + 1)) {
				this.layers.create();
			}
			
			layers[layer].match(/(?<=line:)[^.]+/gi).map(line => line.split(/\u002D/g)).forEach((line) => {
				const element = document.createElementNS("http://www.w3.org/2000/svg", "line");
				element.style.setProperty("stroke", this.primary);
        		element.style.setProperty("stroke-width", 4);
				element.setAttribute("x1", line[0]);
				element.setAttribute("y1", line[1]);
				element.setAttribute("x2", line[2]);
				element.setAttribute("y2", line[3]);

				this.layers.get(parseInt(layer) + 1).base.appendChild(element);
				this.layers.get(parseInt(layer) + 1).lines.push(element);
			});

			layers[layer].match(/(?<=brush:)[^.]+/gi).forEach((points) => {
				const element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
				element.style.setProperty("stroke", this.primary);
        		element.style.setProperty("stroke-width", 4);
				element.setAttribute("points", points);

				this.layers.get(parseInt(layer) + 1).base.appendChild(element);
				this.layers.get(parseInt(layer) + 1).lines.push(element);
			});

			layers[layer].match(/(?<=circle:)[^.]+/gi).map(line => line.split(/\u002D/g)).forEach((line) => {
				const element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
				element.style.setProperty("stroke", this.primary);
				element.style.setProperty("fill", this.fill ? this.primary : "#FFFFFF00");
        		element.style.setProperty("stroke-width", 4);
				element.setAttribute("cx", line[0]);
				element.setAttribute("cy", line[1]);
				element.setAttribute("r", line[2]);

				this.layers.get(parseInt(layer) + 1).base.appendChild(element);
				this.layers.get(parseInt(layer) + 1).lines.push(element);
			});

			layers[layer].match(/(?<=rectangle:)[^.]+/gi).map(line => line.split(/\u002D/g)).forEach((line) => {
				const element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
				element.style.setProperty("stroke", this.primary);
				element.style.setProperty("fill", this.fill ? this.primary : "#FFFFFF00");
        		element.style.setProperty("stroke-width", 4);
				element.setAttribute("x", line[0]);
				element.setAttribute("y", line[1]);
				element.setAttribute("width", line[2]);
				element.setAttribute("height", line[3]);
				element.setAttribute("rx", .5);

				this.layers.get(parseInt(layer) + 1).base.appendChild(element);
				this.layers.get(parseInt(layer) + 1).lines.push(element);
			});
		}
	}
	resize(event) {
		const boundingRect = this.view.getBoundingClientRect();
		this.view.setAttribute("viewBox", `0 0 ${boundingRect.width} ${boundingRect.height}`);

		this.text.setAttribute("x", boundingRect.width / 2 + this.viewBox.x - this.text.innerHTML.length * 2.5);
		this.text.setAttribute("y", 25 + this.viewBox.y);
	}
	undo() {
		const event = this.events.pop();
		if (event) {
			switch(event.action) {
				case "add":
					event.value.remove();

					break;

				case "remove":
					this.view.prepend(event.value);

					break;

				case "move_selected":
					event.data.selected.map(function(line, index) {
						let type = parseInt(line.getAttribute("x")) ? 0 : parseInt(line.getAttribute("x1")) ? 1 : parseInt(line.getAttribute("cx")) ? 2 : parseInt(line.getAttribute("points")) ? 3 : NaN;
						if (isNaN(type)) {
							return;
						}
		
						switch(type) {
							case 0:
								line.setAttribute("x", event.data.cache[index].getAttribute("x"));
								line.setAttribute("y", event.data.cache[index].getAttribute("y"));
		
								break;
		
							case 1:
								line.setAttribute("x1", event.data.cache[index].getAttribute("x1"));
								line.setAttribute("y1", event.data.cache[index].getAttribute("y1"));
								line.setAttribute("x2", event.data.cache[index].getAttribute("x2"));
								line.setAttribute("y2", event.data.cache[index].getAttribute("y2"));
		
								break;
		
							case 2:
								line.setAttribute("cx", event.data.cache[index].getAttribute("cx"));
								line.setAttribute("cy", event.data.cache[index].getAttribute("cy"));
		
								break;

							case 3:
								line.setAttribute("points", event.data.cache[index].getAttribute("points"));

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
			switch(event.action) {
				case "add":
					this.view.prepend(event.value);

					break;

				case "remove":
					event.value.remove();

					break;

				case "move_selected":
					event.data.selected.map(function(line, index) {
						let type = parseInt(line.getAttribute("x")) ? 0 : parseInt(line.getAttribute("x1")) ? 1 : parseInt(line.getAttribute("cx")) ? 2 : parseInt(line.getAttribute("points")) ? 3 : NaN;
						if (isNaN(type)) {
							return;
						}
		
						switch(type) {
							case 0:
								line.setAttribute("x", event.data.secondaryCache[index].getAttribute("x"));
								line.setAttribute("y", event.data.secondaryCache[index].getAttribute("y"));
		
								break;
		
							case 1:
								line.setAttribute("x1", event.data.secondaryCache[index].getAttribute("x1"));
								line.setAttribute("y1", event.data.secondaryCache[index].getAttribute("y1"));
								line.setAttribute("x2", event.data.secondaryCache[index].getAttribute("x2"));
								line.setAttribute("y2", event.data.secondaryCache[index].getAttribute("y2"));
		
								break;
		
							case 2:
								line.setAttribute("cx", event.data.secondaryCache[index].getAttribute("cx"));
								line.setAttribute("cy", event.data.secondaryCache[index].getAttribute("cy"));
		
								break;

							case 3:
								line.setAttribute("points", event.data.secondaryCache[index].getAttribute("points"));

								break;
						}
					});

					break;
			}

			return event;
		}

		return null;
	}
	mouseDown(event) {
		const patchNotes = this.container.querySelector("#patch-notes") || {};
		if (patchNotes.iframe) {
			patchNotes.iframe.remove();

			patchNotes.iframe = null;
		}

		if (event.button === 1) {
			this.tools.select(this.tool.constructor.id === "line" ? "brush" : this.tool.constructor.id === "brush" ? "eraser" : this.tool.constructor.id === "eraser" ? "camera" : "line");
			
			return;
		} else if (event.button === 2) {
			// open colour palette
			colour.style.left = this.mouse.real.x + "px";
			colour.style.top = this.mouse.real.y + "px";
			setTimeout(() => {
				colour.click();
			});
			
			return;
		}

		if (!this.mouse.isAlternate) {
			if (event.shiftKey) {
				clearTimeout(this.text.timeout);

				this.text.innerHTML = "Camera";
				this.text.setAttribute("x", this.view.width.baseVal.value / 2 - this.text.innerHTML.length * 2 + this.viewBox.x);
				this.text.setAttribute("y", 20 + this.viewBox.y);
				this.text.setAttribute("fill", this.primary);
				this.view.appendChild(this.text);

				this.text.timeout = setTimeout(() => {
					this.text.remove();
				}, 2000);

				return;
			}

			if (event.ctrlKey) {
				this.tools.select("select");
			}

			this.tool.mouseDown(event);
		}
		
		return;
	}
	mouseMove(event) {
		if (this.tool.constructor.id === "eraser") {
			this.tool.mouseMove(event);
			
			return;
		} else if (this.tool.constructor.id === "curve") {
			this.tool.mouseMove(event);

			return;
		}

		if (this.mouse.isDown && !this.mouse.isAlternate) {	
			if (event.shiftKey) {
				this.view.setAttribute("viewBox", `${this.viewBox.x - event.movementX} ${this.viewBox.y - event.movementY} ${window.innerWidth} ${window.innerHeight}`);
				this.text.setAttribute("x", this.view.width.baseVal.value / 2 - this.text.innerHTML.length * 2 + this.viewBox.x);
				this.text.setAttribute("y", 20 + this.viewBox.y);
	
				return;
			}

			this.tool.mouseMove(event);
		}

		return;
	}
	mouseUp(event) {
		if (!this.mouse.isAlternate) {
			this.tool.mouseUp(event);
		}
		
		return;
	}
	keyDown(event) {
		event.preventDefault();
		event.stopPropagation();
		switch(event.key) {
			case "Escape":
				if (layers.style.display !== "none") {
					layers.style.display = "none";
					
					break;
				}
	
				//settings.style.visibility = "show";
				settings.style.display = settings.style.display === "flex" ? "none" : "flex";
				break;
			
			case "=":
				if (this.tool.size >= 100) {
					break;
				}
	
				this.tool.size += 1;
				break;
				
			case "-":
				if (this.tool.size <= 2) {
					break;
				}
	
				this.tool.size -= 1;
				break;
	
			case "0":
				this.tools.select("camera");
				break;
	
			case "1":
				this.tools.select("line");
				break;
			
			case "2":
				this.tools.select("brush");
				break;
	
			case "3":
				this.tools.select("circle");
				break;
	
			case "4":
				this.tools.select("rectangle");
				break;
	
			case "5":
				this.tools.select("eraser");
				break;
	
			case "f":
				this.fill = !this.fill;
				break;
	
			case "ArrowUp":
				if (this.layerDepth >= this.layers.cache.length) {
					if (!event.shiftKey) {
						break;
					}
	
					this.layers.create();
				}
	
				this.layerDepth = this.layerDepth + 1;
				break;
	
			case "ArrowDown":
				if (this.layerDepth <= 1) {
					break;
				}
	
				this.layerDepth = this.layerDepth - 1;
				break;
	
			case "z":
				this.undo();
				break;
	
			case "x":
				this.redo();
				break;
	
			case "c":
				if (this.tool.constructor.id === "select" && event.ctrlKey) {
					this.tool.copy();
	
					break;
				}
				
				break;
	
			case "v":
				if (this.tool.constructor.id === "select" && event.ctrlKey) {
					this.tool.paste();
	
					break;
				}
	
				break;
		}
	}
	export() {
		return this.layers.cache.map(function(layer) {
			return `${layer.toString()}`;
		}).join(">");
	}
	close() {
		this.mouse.close();
	}
}