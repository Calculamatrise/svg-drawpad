export default class extends Array {
	cache = []
	constructor() {
		super(...arguments),
		Object.defineProperty(this.cache, 'pop', {
			enumerable: false,
			value: () => {
				const popped = Array.prototype.pop.call(this.cache);
				if (popped && this.length < 5000) {
					super.push(popped);
				}

				return popped
			},
			writable: true
		})
	}
	push(...args) {
		super.push(...args),
		this.cache.splice(0);
		return args.length
	}

	pop(...args) {
		const popped = super.pop(...args);
		if (popped && this.cache.length < 5000) {
			this.cache.push(popped);
		}

		return popped
	}

	close() {
		this.splice(0),
		this.cache.splice(0)
	}
}