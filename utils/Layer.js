export default class {
    constructor(parent) {
        this.parent = parent;
        this.id = this.parent.cache.length + 1;
        this.element = this.parent.createElement("div", {
            className: "layer selected",
            mouseover(event) {
                if (event.target.className !== this.className) {
                    this.style.cursor = "default";
                    return;
                }
    
                this.style.cursor = "pointer";
            },
            click: event => {
                if (event.target.className !== this.element.className) {
                    return;
                }

                window.canvas.layerDepth = this.id;
                this.parent.cache.forEach(function(layer) {
                    layer.element.classList.remove("selected");
                    if (layer.id === window.canvas.layerDepth) {
                        layer.element.classList.add("selected");   
                    }
                });

                this.element.querySelector("#selector").focus();
            }
        });

        const layerSelectorContainer = this.parent.createElement("div", {
            innerText: "Layer ",
            mouseover(event) {    
                this.style.cursor = "pointer";
            },
            click: event => {
                window.canvas.layerDepth = this.id;
                this.parent.cache.forEach(function(layer) {
                    layer.element.classList.remove("selected");
                    if (layer.id === window.canvas.layerDepth) {
                        layer.element.classList.add("selected");   
                    }
                });

                layerSelectorContainer.querySelector("#selector").focus();
            }
        });

        this.selector = this.parent.createElement("input", {
            type: "number",
            id: "selector",
            className: "ripple selector",
            step: "1",
            value: this.id,
            keydown(event) {
                event.stopPropagation();
            },
            mouseover(event) {    
                this.style.cursor = "pointer";
            },
            input: (event) => {
                if (parseInt(event.target.value) < 1) {
                    event.target.value = 1;
                    return;
                } else if (parseInt(event.target.value) > this.parent.cache.length) {
                    event.target.value = this.parent.cache.length;
                    return;
                } else if (isNaN(parseInt(event.target.value))) {
                    return;
                } else if (parseInt(event.target.value) === this.id) {
                    return;
                }

                this.move(parseInt(event.target.value));
                
                this.element.querySelector("#selector").focus();
            }
        });

        layerSelectorContainer.append(this.selector);

        const range = this.parent.createElement("input", {
            type: "range",
            min: 0,
            max: 100,
            value: 100,
            style: {
                width: "100px",
                "pointer-events": "all"
            }
        });

        const optionTwo = this.parent.createElement("div", {
            className: "option",
            innerText: "Opacity",
            style: {
                "flex-direction": "column"
            },
            mousemove: (event) => {
                if (event.buttons !== 1) {
                    return;
                }
                
                this.opacity = range.value / 100;
            }
        });

        optionTwo.appendChild(range);

        const checkbox = this.parent.createElement("input", {
            type: "checkbox"
        });

        const option = this.parent.createElement("div", {
            className: "option ripple",
            innerText: "Hide",
            click: (event) => {
                this.toggleVisiblity();
                checkbox.checked = this.hidden;
            }
        });

        option.prepend(checkbox);

        const clearButton = this.parent.createElement("button", {
            innerText: "Clear",
            click: (event) => {
                if (confirm(`Are you sure you\'d like to clear Layer ${this.id}?`)) {
                    this.clear();
                }
            }
        });

        const mergeButton = this.parent.createElement("button", {
            innerText: "Merge",
            click: (event) => {
                if (this.parent.cache.length <= 1) {
                    alert("There must be more than one layer in order to merge layers!");
                    return;
                }

                let layerId = prompt(`Which layer would you like to merge Layer ${this.id} with?`);
                if (layerId !== null) {
                    let layer = this.parent.get(parseInt(layerId));
                    while(layer === void 0) {
                        layerId = prompt(`That is not a valid option. Try again or cancel; which layer would you like to merge Layer ${this.id} with?`);
                        if (layerId === null) {
                            return;
                        }

                        layer = this.parent.get(parseInt(layerId));
                    }

                    if (layer) {
                        const layer = this.parent.get(layerId);
                        if (layer) {
                            for (const line of this.lines) {
                                layer.lines.push(line);
                                layer.base.appendChild(line);
                            }

                            this.remove();
                        }
                    }
                }
            }
        });

        const deleteButton = this.parent.createElement("button", {
            innerText: "Delete",
            click: () => {
                if (this.parent.cache.length <= 1) {
                    alert("You must have at least one layer at all times!");
    
                    return;
                }
    
                if (confirm(`Are you sure you\'d like to delete Layer ${this.id}?`)) {
                    this.remove();
                }
            }
        });

        const options = this.parent.createElement("div", {
            className: "options"
        });

        options.append(optionTwo, option, clearButton, mergeButton, deleteButton);
        this.element.append(layerSelectorContainer, options);
        layers.querySelector("#layer-container").append(this.element);
        this.element.scrollIntoView({
            behavior: "smooth"
        });

        this.base = document.querySelector(`g[data-id='${this.id}']`) ?? [...document.querySelectorAll("g:not([data-id])")].filter(element => element.parentElement.id === "view")[0] ?? document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.base.dataset.id = this.id;

        if (this.id === 1) {
            view.prepend(this.base);
        } else {
            view.querySelector(`g[data-id='${this.id - 1}']`).after(this.base);
        }

        this.parent.cache.push(this);
    }
    alpha = 1;
    hidden = false;
    lines = []
    get opacity() {
        return this.alpha;
    }

    set opacity(alpha) {
        this.alpha = alpha;
        this.base.style.setProperty("opacity", this.alpha);
    }

    toggleVisiblity() {
        this.hidden = !this.hidden;
        this.base.style.setProperty("visibility", this.hidden ? "hidden" : "unset");
    }

    push(object) {
        this.base.appendChild(object);
        this.lines.push(object);
    }

    move(newIndex) {
        if (typeof newIndex !== "number" || newIndex === void 0 || this.id === newIndex) {
            throw new Error("Invalid index.");
        }

        this.parent.remove(this.id);
        this.parent.cache.forEach((layer) => {
            if (this.id < newIndex) {
                if (layer.id === newIndex - 1) {
                    layer.base.after(this.base);
                    layer.element.after(this.element);
                }
            } else {
                if (layer.id === newIndex) {
                    layer.base.before(this.base);
                    layer.element.before(this.element);
                }
            }
        });

        this.parent.insert(this, newIndex - 1);
        this.element.scrollIntoView({
            behavior: "smooth"
        });
    }

    clear() {
        for (const line of this.lines) {
            line.remove();
        }

        this.lines = []
    }

    remove() {
        this.clear();
        this.element.remove();
        this.base.remove();
        this.parent.remove(this.id);
        if (this.parent.cache.length < window.canvas.layerDepth) {
            window.canvas.layerDepth = window.canvas.layerDepth === this.id ? this.parent.cache.length : 1;
        }

        return this;
    }
}