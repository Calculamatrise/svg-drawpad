export default class {
    constructor(parent) {
        this.parent = parent;
    }
    
    _size = null;
    active = false;
    get canvas() {
        return this.parent.canvas;
    }

    get mouse() {
        return this.canvas.mouse;
    }

    get size() {
        return this._size;
    }

    set size(size) {
        this._size = size;

        this.init();

        clearTimeout(this.canvas.text.timeout);

        this.canvas.text.innerHTML = this.constructor.id.charAt(0).toUpperCase() + this.constructor.id.slice(1) + " size - " + this.size;
		this.canvas.text.setAttribute("x", this.canvas.viewBox.width / 2 - this.canvas.text.innerHTML.length * 2.5 + this.canvas.viewBox.x);
		this.canvas.text.setAttribute("y", 25 + this.canvas.viewBox.y);
		this.canvas.text.setAttribute("fill", this.canvas.dark ? "#FBFBFB" : "1B1B1B");
		this.canvas.view.appendChild(this.canvas.text);

        this.canvas.text.timeout = setTimeout(() => {
			this.canvas.text.remove();
		}, 2000);
    }

    init() {}
    createElementNS(element, properties = {}) {
        if (typeof element !== "string" || element === void 0) {
			throw new Error("Invalid element! What were you thinking?");
		} else if (typeof properties !== "object" || properties === void 0) {
			throw new Error("Invalid property object! What were you thinking?");
		}

        element = document.createElementNS("http://www.w3.org/2000/svg", element);
        for (const property in properties) {
            if (typeof properties[property] === "function") {
                throw new Error("Haven't gotten to this yet.");

                continue;
            } else if (property.toLowerCase() === "style" && typeof properties[property] === "object") {
                for (const style in properties[property]) {
                    element.style.setProperty(style, properties[property][style]);
                }
                
                continue;
            }

            element.setAttribute(property, properties[property]);
        }

        return element;
    }
    
    mouseDown() {}
    mouseMove() {}
    mouseUp() {}
    close() {}
}