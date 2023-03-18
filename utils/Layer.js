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
			children: [
				this.parent.createElement('div', {
					children: [
						this.selector = this.parent.createElement('input', {
							type: 'number',
							id: 'selector',
							className: 'ripple selector',
							step: '1',
							value: this.id,
							onchange: event => {
								if (parseInt(event.target.value) < 1) {
									event.target.value = 1;
									return;
								} else if (parseInt(event.target.value) > this.parent.cache.length) {
									event.target.value = this.parent.cache.length;
									return;
								} else if (isNaN(event.target.value) || parseInt(event.target.value) === this.id) {
									return;
								}

								this.move(parseInt(event.target.value));
								this.selector.focus();
							},
							onkeydown(event) {
								event.stopPropagation();
							},
							onmouseover() {
								this.style.cursor = 'pointer';
							},
							style: {
								padding: 0,
								width: '2rem'
							}
						})
					],
					innerText: 'Layer ',
					onclick() {
						window.canvas.layerDepth = this.id;
						parent.cache.forEach(function (layer) {
							layer.element.classList.remove('selected');
							if (layer.id === window.canvas.layerDepth) {
								layer.element.classList.add('selected');
							}
						});

						this.querySelector('#selector').focus();
					}
				}),
				this.parent.createElement('div', {
					className: 'options',
					children: [
						this.parent.createElement('div', {
							children: [
								this.parent.createElement('input', {
									max: 100,
									min: 0,
									type: 'range',
									value: 100,
									style: {
										width: '100px',
										pointerEvents: 'all'
									},
									oninput: event => {
										this.opacity = event.target.value / 100;
									}
								})
							],
							className: 'option',
							innerText: 'Opacity',
							style: {
								flexDirection: 'column'
							}
						}),
						this.parent.createElement('label', {
							children: [
								this.parent.createElement('input', {
									onchange: this.toggleVisiblity.bind(this),
									type: 'checkbox'
								})
							],
							className: 'button option ripple',
							innerText: 'Hide'
						}),
						this.parent.createElement('button', {
							innerText: 'Clear',
							onclick: this.clear.bind(this)
						}),
						this.parent.createElement('button', {
							innerText: 'Merge',
							onclick: this.merge.bind(this)
						}),
						this.parent.createElement('button', {
							innerText: 'Delete',
							onclick: this.remove.bind(this),
							style: {
								color: 'crimson'
							}
						})
					]
				})
			],
			className: 'layer selected',
			onclick: event => {
				if (event.target.className !== this.element.className) {
					return;
				}

				window.canvas.layerDepth = this.id;
				this.parent.cache.forEach(function (layer) {
					layer.element.classList.remove('selected');
					if (layer.id === window.canvas.layerDepth) {
						layer.element.classList.add('selected');
					}
				});

				this.selector.focus();
			},
			onpointerdown(event) {
				if (event.target != this) {
					return;
				}

				this.setPointerCapture(event.pointerId);
			},
			ongotpointercapture(event) {
				this.onpointermove = function slide({ movementX }) {
					// move after element it passes
					const { left: leftBoundary, right: rightBoundary } = this.parentElement.getBoundingClientRect();
					const { left, right } = this.getBoundingClientRect();
					if ((left + movementX <= leftBoundary) || (right + movementX >= rightBoundary)) {
						return;
					}

					this.style.setProperty('translate', parseInt(this.style.getPropertyValue('translate').padEnd(1, '0')) + movementX + 'px');
				}
				this.style.setProperty('z-index', '1004');
			},
			// onpointermove(event) {
			// 	console.dir(this)
			// 	if (event.button != -1) {
			// 		// // readjust position.
			// 		// this.style.removeProperty('position');
			// 		// this.parentElement.style.removeProperty('height');
			// 		// this.parentElement.style.removeProperty('width');
			// 		return;
			// 	}

			// 	const { left: leftBoundary, right: rightBoundary } = this.parentElement.getBoundingClientRect();
			// 	const { left, right } = this.getBoundingClientRect();
			// 	const translation = parseInt(this.style.getPropertyValue('translate').padEnd(1, '0')) + movementX;
			// 	if ((left + translation < leftBoundary) || (right + translation > rightBoundary)) {
			// 		return;
			// 	}

			// 	console.log(rightBoundary, right + translation)
			// 	this.style.setProperty('translate', translation + 'px');
			// },
			onlostpointercapture: () => {
				this.element.onpointermove = null;
				this.element.style.removeProperty('z-index');
				const { x } = this.element.getBoundingClientRect();
				const nextSibling = parent.cache.filter(({ element }) => element.getBoundingClientRect().x < x);
				this.element.style.removeProperty('translate');
				nextSibling.selector && this.move(nextSibling.id);
				// let nextSibling = this.element.nextElementSibling;
				// while (nextSibling && nextSibling.getBoundingClientRect().x < x) {
				// 	if (!nextSibling.nextElementSibling) break;
				// 	nextSibling = nextSibling.nextElementSibling;
				// }

				// console.log(nextSibling, parent.cache.filter(({ element }) => element.getBoundingClientRect().x < x))
				// this.style.removeProperty('translate');
				// nextSibling.after(this.element)
			},
			onpointerup(event) {
				this.releasePointerCapture(event.pointerId);
			}
		});

		this.parent.element.lastElementChild.before(this.element);
		this.element.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			// inline: 'center'
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
			behavior: 'smooth',
			block: 'nearest',
			// inline: 'center'
		});
	}

	clear(bypass) {
		if (bypass !== true && confirm(`Are you sure you\'d like to clear Layer ${this.id}?`)) {
			for (const line of this.lines) {
				line.remove();
			}

			this.lines = [];
		}
	}

	merge() {
		if (this.parent.cache.length <= 1) {
			alert("There must be more than one layer in order to merge layers!");
			return;
		}

		let layerId = prompt(`Which layer would you like to merge Layer ${this.id} with?`);
		if (layerId !== null) {
			let layer = this.parent.get(parseInt(layerId));
			while (layer === void 0) {
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

	remove() {
		if (this.parent.cache.length <= 1) {
			alert("You must have at least one layer at all times!");
			return;
		} else if (!confirm(`Are you sure you\'d like to delete Layer ${this.id}?`)) {
			return;
		}

		this.clear(true);
		this.element.remove();
		this.base.remove();
		this.parent.remove(this.id);
		if (this.parent.cache.length < window.canvas.layerDepth) {
			window.canvas.layerDepth = window.canvas.layerDepth === this.id ? this.parent.cache.length : 1;
		}

		return this;
	}
}