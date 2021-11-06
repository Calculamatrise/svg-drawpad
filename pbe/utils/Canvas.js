import MouseHandler from "./MouseHandler.js";
import EventHandler from "./EventHandler.js";
import ToolHandler from "./ToolHandler.js";

import LayerManager from "./LayerManager.js";

export default class {
	constructor(view) {
		this.view = view;
		this.view.style.setProperty("stroke-linecap", "round");
        this.view.style.setProperty("stroke-linejoin", "round");
		this.view.setAttribute("viewBox", `0 0 ${this.view.width.baseVal.value} ${this.view.height.baseVal.value}`);

		this.layers.create();

		this.mouse.init();
		this.mouse.on("down", this.mouseDown.bind(this));
		this.mouse.on("move", this.mouseMove.bind(this));
		this.mouse.on("up", this.mouseUp.bind(this));

		window.addEventListener("resize", this.resize.bind(this));

		document.addEventListener("keydown", this.keyDown.bind(this));
	}
	zoom = 1;
	zoomIncrementValue = 0.5;
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
		this.text.setAttribute("x", this.viewBox.width / 2 + this.viewBox.x - this.text.innerHTML.length * 2.5);
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
		return this.view.parentElement || document.querySelector("#container");
	}
	get viewBox() {
		const viewBox = this.view.getAttribute("viewBox").split(/\s+/g);
		return {
			x: parseFloat(viewBox[0]),
			y: parseFloat(viewBox[1]),
			width: parseFloat(viewBox[2]),
			height: parseFloat(viewBox[3])
		}
	}
	import(data) {
		try {
			this.close();

			const newView = new DOMParser().parseFromString(data, "text/xml").querySelector("svg");

			this.view.innerHTML = newView.innerHTML;

			let layerId = 1;
			while(true) {
				if ([...document.querySelectorAll("g:not([data-id])")].filter(element => element.parentElement.id === "view").length < 1) {
					break;
				}

				this.layers.create();

				layerId++;
			}

			this.layerDepth = this.layers.cache.length;
		} catch(error) {
			console.error(error);
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
				this.text.setAttribute("x", this.viewBox.width / 2 - this.text.innerHTML.length * 2 + this.viewBox.x);
				this.text.setAttribute("y", 20 + this.viewBox.y);
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
		if (this.mouse.isDown && !this.mouse.isAlternate) {	
			if (event.shiftKey) {
				this.tools.get("camera").mouseMove(event);
	
				return;
			}

			this.tool.mouseMove(event);
		}

		if (["curve", "eraser"].includes(this.tool.constructor.id)) {
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
				if (this.tool.constructor.id === "camera" || event.ctrlKey) {
					if (this.zoom <= 1) {
						break;
					}

					this.zoom -= this.zoomIncrementValue;
					
					this.view.setAttribute("viewBox", `${this.viewBox.x + (this.viewBox.width - window.innerWidth * this.zoom) / 2} ${this.viewBox.y + (this.viewBox.height - window.innerHeight * this.zoom) / 2} ${window.innerWidth * this.zoom} ${window.innerHeight * this.zoom}`);
					this.text.setAttribute("y", 25 + this.viewBox.y);

					this.tool.init();

					break;
				}

				if (this.tool.size >= 100) {
					break;
				}
	
				this.tool.size += 1;
				break;
				
			case "-":
				if (this.tool.constructor.id === "camera" || event.ctrlKey) {
					if (this.zoom >= 10) {
						break;
					}

					this.zoom += this.zoomIncrementValue;
					
					this.view.setAttribute("viewBox", `${this.viewBox.x - (window.innerWidth * this.zoom - this.viewBox.width) / 2} ${this.viewBox.y - (window.innerHeight * this.zoom - this.viewBox.height) / 2} ${window.innerWidth * this.zoom} ${window.innerHeight * this.zoom}`);
					this.text.setAttribute("y", 25 + this.viewBox.y);

					this.tool.init();

					break;
				}

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
	toString() {
		return this.view.outerHTML;
	}
	close() {
		this.layers.close();
		this.mouse.close();
		this.events.close();
	}
}