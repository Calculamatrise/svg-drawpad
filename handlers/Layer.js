import Layer from "../utils/Layer.js";

export default class {
    constructor(parent) {
        this.canvas = parent;
    }
    cache = []
    get element() {
        return this.canvas.container.querySelector("user-interface #layers #layer-container");
    }

    create() {
        this.cache.forEach(function(layer) {
            layer.element.classList.remove("selected");
        });

        return new Layer(this);
    }

    get(layerId) {
        return this.cache.find(function(layer) {
            if (layer.id === parseInt(layerId)) {
                return true;
            }

            return false;
        });
    }

    has(layerId) {
        return !!this.get(layerId);
    }

    insert(layer, index) {
        this.canvas.layerDepth = index + 1;
        this.cache.splice(index, 0, layer);
        this.cache.forEach((layer, index) => {
            layer.element.querySelector("#selector").value = layer.base.dataset.id = layer.id = index + 1;
            if (layer.id > 1) {
                view.querySelector(`g[data-id='${index}']`).after(layer.base);
            }

            layer.element.classList.remove("selected");
            if (layer.id === this.canvas.layerDepth) {
                layer.element.classList.add("selected");
            }
        });

        return this;
    }

    remove(layerId) {
        const layer = this.cache.splice(this.cache.indexOf(this.get(layerId)), 1);
        this.cache.forEach((layer, index) => {
            layer.element.querySelector("#selector").value = layer.base.dataset.id = layer.id = index + 1;
            layer.element.classList.remove("selected");
            if (layer.id === this.canvas.layerDepth) {
                layer.element.classList.add("selected");
            }
        });

        return layer;
    }

    createElement(type, options = {}) {
        let element = document.createElement(type);
        for (const attribute in options) {
            if (typeof options[attribute] === "object") {
                if (attribute === "style") {
                    for (const property in options[attribute]) {
                        element.style.setProperty(property, options[attribute][property]);
                    }
                } else if (attribute === "children") {
                    element.append(...options[attribute]);
                }
            } else if (typeof options[attribute] === "function") {
                element.addEventListener(attribute, options[attribute]);
            } else {
                if (attribute.startsWith("inner")) {
                    element[attribute] = options[attribute];
                } else {
                    element.setAttribute(attribute, options[attribute]);
                }
            }
        }

		return element;
	}

    close() {
        this.cache.forEach(function(layer) {
            layer.remove();
        });

        this.cache = []
    }
}