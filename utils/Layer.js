export default class {
    get opacity() {
        return this.alpha;
    }

    set opacity(alpha) {
        this.alpha = parseFloat(alpha);
        this.base.style.setProperty('opacity', this.alpha);
    }

    alpha = 1;
    hidden = false;
    lines = [];
    constructor(parent) {
        this.parent = parent;
        this.id = this.parent.cache.length + 1;
        this.element = this.parent.createElement('div', {
            class: 'layer selected',
            mousemove(event) {
                if ((event.buttons & 1) != 1) {
                    // readjust position.
                    this.style.setProperty('position', 'block');
                    return;
                }

                // this.style.setProperty('position', 'absolute');
                // this.style.setProperty('left', event.clientX + 'px');
                // this.style.setProperty('top', event.clientY + 'px');
            },
            mouseover(event) {
                if (event.target.className !== this.className) {
                    return void this.style.setProperty('cursor', 'default');
                }

                this.style.cursor = 'pointer';
            },
            click: event => {
                if (event.target.className !== this.element.className) {
                    return;
                }

                window.canvas.layerDepth = this.id;
                this.parent.cache.forEach(function(layer) {
                    layer.element.classList.remove('selected');
                    if (layer.id === window.canvas.layerDepth) {
                        layer.element.classList.add('selected');   
                    }
                });

                this.element.querySelector('#selector').focus();
            },
            children: [
                this.parent.createElement('div', {
                    innerText: 'Layer ',
                    mouseover() {    
                        this.style.cursor = 'pointer';
                    },
                    click() {
                        window.canvas.layerDepth = this.id;
                        parent.cache.forEach(function(layer) {
                            layer.element.classList.remove('selected');
                            if (layer.id === window.canvas.layerDepth) {
                                layer.element.classList.add('selected');   
                            }
                        });

                        this.querySelector('#selector').focus();
                    },
                    children: [
                        this.selector = this.parent.createElement('input', {
                            type: 'number',
                            id: 'selector',
                            class: 'ripple selector',
                            step: '1',
                            value: this.id,
                            keydown(event) {
                                event.stopPropagation();
                            },
                            mouseover() {    
                                this.style.cursor = 'pointer';
                            },
                            change: event => {
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
                                this.element.querySelector('#selector').focus();
                            }
                        })
                    ]
                }),
                this.parent.createElement('div', {
                    class: 'options',
                    children: [
                        this.parent.createElement('div', {
                            class: 'option',
                            innerText: 'Opacity',
                            style: {
                                'flex-direction': 'column'
                            },
                            children: [
                                this.parent.createElement('input', {
                                    type: 'range',
                                    min: 0,
                                    max: 100,
                                    value: 100,
                                    style: {
                                        width: '100px',
                                        'pointer-events': 'all'
                                    },
                                    input: event => {
                                        this.opacity = event.target.value / 100;
                                    }
                                })
                            ]
                        }),
                        this.parent.createElement('div', {
                            class: 'option ripple',
                            innerText: 'Hide',
                            click: event => {
                                this.toggleVisiblity();
                                event.target.firstElementChild.checked = this.hidden;
                            },
                            children: [
                                this.parent.createElement('input', {
                                    type: 'checkbox'
                                })
                            ]
                        }),
                        this.parent.createElement('button', {
                            innerText: 'Clear',
                            click: () => {
                                if (confirm(`Are you sure you\'d like to clear Layer ${this.id}?`)) {
                                    this.clear();
                                }
                            }
                        }),
                        this.parent.createElement('button', {
                            innerText: 'Merge',
                            click: () => {
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
                                            const lines = this.lines;
                                            this.remove();
                                            for (const line of lines) {
                                                layer.push(line);
                                            }
                                        }
                                    }
                                }
                            }
                        }),
                        this.parent.createElement('button', {
                            innerText: 'Delete',
                            style: {
                                color: 'crimson'
                            },
                            click: () => {
                                if (this.parent.cache.length <= 1) {
                                    alert("You must have at least one layer at all times!");
                                    return;
                                } else if (confirm(`Are you sure you\'d like to delete Layer ${this.id}?`)) {
                                    this.remove();
                                }
                            }
                        })
                    ]
                })
            ]
        });

        this.parent.element.lastElementChild.before(this.element);
        this.element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });

        this.base = document.querySelector(`g[data-id='${this.id}']`) ?? [...document.querySelectorAll("g:not([data-id])")].filter(element => element.parentElement.id === 'view')[0] ?? document.createElementNS("http://www.w3.org/2000/svg", 'g');
        this.base.dataset.id = this.id;
        if (this.id === 1) {
            view.prepend(this.base);
        } else {
            view.querySelector(`g[data-id='${this.id - 1}']`).after(this.base);
        }

        this.parent.cache.push(this);
    }

    toggleVisiblity() {
        this.hidden = !this.hidden;
        this.base.style.setProperty('visibility', this.hidden ? 'hidden' : 'unset');
    }

    push(object) {
        this.base.appendChild(object);
        this.lines.push(object);
    }

    move(newIndex) {
        if (typeof newIndex != 'number' || newIndex === void 0 || this.id === newIndex) {
            throw new Error("Invalid index.");
        }

        this.parent.remove(this.id);
        this.parent.cache.forEach((layer) => {
            if (this.id < newIndex) {
                if (layer.id === newIndex - 1) {
                    layer.base.after(this.base);
                    layer.element.after(this.element);
                }
            } else if (layer.id === newIndex) {
                layer.base.before(this.base);
                layer.element.before(this.element);
            }
        });

        this.parent.insert(this, newIndex - 1);
        this.element.scrollIntoView({
            behavior: 'smooth'
        });
    }

    clear() {
        for (const line of this.lines) {
            line.remove();
        }

        this.lines = [];
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