import Layer from "./Layer.js";

export default class {
    cache = []
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
        window.canvas.layerDepth = index + 1;

        this.cache.splice(index, 0, layer);
        this.cache.forEach((layer, index) => {
            layer.element.querySelector("#selector").value = layer.base.dataset.id = layer.id = index + 1;
            if (layer.id > 1) {
                view.querySelector(`g[data-id='${index}']`).after(layer.base);
            }

            layer.element.classList.remove("selected");
            if (layer.id === window.canvas.layerDepth) {
                layer.element.classList.add("selected");
            }
        });

        return this;
    }
    remove(layerId) {
        const layer = this.cache.splice(this.cache.indexOf(this.get(layerId)), 1);
        
        this.cache.forEach(function(layer, index) {
            layer.element.querySelector("#selector").value = layer.base.dataset.id = layer.id = index + 1;

            layer.element.classList.remove("selected");
            if (layer.id === window.canvas.layerDepth) {
                layer.element.classList.add("selected");
            }
        });

        return layer;
    }
    createElement(element, properties = {}) {
		if (typeof element !== "string" || element === void 0) {
			throw new Error("Invalid element! What were you thinking?");
		} else if (typeof properties !== "object" || properties === void 0) {
			throw new Error("Invalid property object! What were you thinking?");
		}

        element = document.createElement(element);
        for (const property in properties) {
            if (typeof properties[property] === "function") {
                element.addEventListener(property, properties[property]);

                continue;
            } else if (property.toLowerCase() === "style" && typeof properties[property] === "object") {
                for (const style in properties[property]) {
                    element.style.setProperty(style, properties[property][style]);
                }

                continue;
            } else if (typeof properties[property] === "object") {
                for (const childProperty in properties[property]) {
                    element[property][childProperty] = properties[property][childProperty];
                }

                continue;
            }

            element[property] = properties[property];
        }
	
		return element;
	}
}