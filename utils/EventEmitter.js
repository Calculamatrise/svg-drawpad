export default class {
	#events = new Map();
	get events() {
		return this.#events.keys();
	}

	/**
	 * 
	 * @param {string} type
	 * @param  {...any} [args]
	 * @returns {boolean}
	 */
	emit(type, ...args) {
		let listeners = this.#events.get(type) ?? new Set();
		let onevent = this['on' + type];
		if (typeof onevent == 'function') {
			listeners.add(onevent);
		}

		for (const listener of listeners.values()) {
			listener.apply(this, args);
		}

		return true;
	}

	/**
	 * 
	 * @param {string} type
	 * @param {function} listener
	 * @param {object} [options]
	 * @returns {number} number of listeners
	 */
	on = this.addEventListener;
	addEventListener(type, listener, options) {
		if (typeof listener != 'function') {
			throw new TypeError("Listener must be of type: Function");
		} else if (!this.#events.has(type)) {
			this.#events.set(type, new Set());
		}

		let listeners = this.#events.get(type);
		return listeners.add(listener).size;
	}

	/**
	 * 
	 * @param {string} type
	 * @param {function} listener
	 * @param {object} [options]
	 * @returns {number} number of listeners
	 */
	off = this.removeEventListener;
	removeEventListener(type, listener, options) {
		let listeners = this.#events.get(type);
		return listeners.delete(listener);
	}

	/**
	 * 
	 * @param {string} type
	 * @returns {boolean}
	 */
	removeAllListeners(type) {
		return this.#events.delete(type);
	}
}