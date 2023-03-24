export default class {
	alpha = 1;
	lines = [];
	constructor(parent) {
		this.parent = parent;
		const id = this.parent.cache.length + 1;
		this.element = this.parent.constructor.createElement('div', {
			children: [
				this.parent.constructor.createElement('label', {
					children: [
						this.selector = this.parent.constructor.createElement('input', {
							className: 'ripple selector',
							id: 'selector',
							min: 1,
							step: 1,
							type: 'number',
							value: id,
							onchange: event => isFinite(event.target.valueAsNumber) && this.move(Math.min(Math.max(event.target.valueAsNumber, 1), this.parent.cache.length)),
							onkeydown: event => event.stopPropagation()
						})
					],
					innerText: 'Layer ',
					onclick: () => this.parent.select(this.id)
				}),
				this.parent.constructor.createElement('div', {
					className: 'options',
					children: [
						this.parent.constructor.createElement('div', {
							children: [
								this.parent.constructor.createElement('input', {
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
						this.parent.constructor.createElement('label', {
							children: [
								this.parent.constructor.createElement('input', {
									type: 'checkbox',
									onchange: this.toggleVisiblity.bind(this),
								})
							],
							className: 'button option ripple',
							innerText: 'Hide',
							onclick() {
								this.firstElementChild.checked = !this.firstElementChild.checked;
								this.firstElementChild.dispatchEvent(new Event('change'));
							}
						}),
						this.parent.constructor.createElement('button', {
							innerText: 'Clear',
							onclick: () => confirm(`Are you sure you\'d like to clear Layer ${this.id}?`) && this.clear()
						}),
						this.parent.constructor.createElement('button', {
							innerText: 'Merge',
							onclick: () => {
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

									layer && this.merge(layerId);
								}
							}
						}),
						this.parent.constructor.createElement('button', {
							innerText: 'Delete',
							style: {
								color: 'crimson'
							},
							onclick: () => {
								if (this.parent.cache.length <= 1) {
									alert("You must have at least one layer at all times!");
									return;
								}

								confirm(`Are you sure you\'d like to delete Layer ${this.id}?`) && this.remove()
							}
						})
					]
				})
			],
			className: 'layer selected',
			onclick: event => event.target === this.element && this.parent.select(this.id),
			onpointerdown(event) {
				event.target === this && this.setPointerCapture(event.pointerId);
			},
			ongotpointercapture(event) {
				if (event.target != this) return;
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
			onlostpointercapture: event => {
				if (event.target != this.element) return;
				this.element.onpointermove = null;
				this.element.style.removeProperty('z-index');
				const sorted = parent.cache.filter(({ element }) => element.getBoundingClientRect().y == this.element.getBoundingClientRect().y).sort(({ element: a }, { element: b }) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
				this.element.style.removeProperty('translate');
				this.move(sorted.indexOf(this) + 1);
			},
			onpointerup(event) {
				event.target === this && this.releasePointerCapture(event.pointerId);
			}
		});

		layers.querySelector('#layer-container').lastElementChild.before(this.element);
		this.element.scrollIntoView({
			behavior: 'smooth',
			block: 'end',
			inline: 'center'
		});

		this.base = document.querySelector(`g[data-id='${id}']`) ?? [...document.querySelectorAll('g:not([data-id])')].filter(element => element.parentElement.id === 'view')[0] ?? document.createElementNS("http://www.w3.org/2000/svg", 'g');
		this.base.dataset.id = id;
		if (id == 1) {
			view.prepend(this.base);
		} else {
			view.querySelector(`g[data-id='${id - 1}']`).after(this.base);
		}
	}

	get hidden() {
		return 'hidden' === this.base.style.getPropertyValue('visibility');
	}

	set hidden(value) {
		this.base.style[(value ? 'set' : 'remove') + 'Property']('visibility', 'hidden');
	}

	get id() {
		return 1 + this.parent.cache.indexOf(this);
	}

	get opacity() {
		return this.alpha;
	}

	set opacity(alpha) {
		this.alpha = parseFloat(alpha);
		this.base.style.setProperty('opacity', this.alpha);
	}

	clear() {
		for (const line of this.lines) {
			line.remove();
		}

		this.lines = [];
	}

	push(object) {
		this.base.appendChild(object);
		this.lines.push(object);
	}

	move(newIndex) {
		const removed = this.parent.remove(this);
		this.parent.insert(removed, newIndex);
		this.element.scrollIntoView({
			behavior: 'smooth',
			block: 'end',
			inline: 'center'
		});
		this.selector.focus();
	}

	toggleVisiblity() {
		this.hidden = !this.hidden;
	}

	merge(layerId) {
		const layer = this.parent.get(layerId);
		if (layer) {
			const lines = this.lines;
			this.remove();
			for (const line of lines) {
				layer.push(line);
			}
		}
	}

	remove() {
		this.clear();
		this.element.remove();
		this.base.remove();
		this.parent.remove(this.id);
	}
}