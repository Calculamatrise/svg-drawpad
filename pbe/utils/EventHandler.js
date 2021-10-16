export default class extends Array {
    cache = []
    push(...args) {
        super.push(...args);

        this.cache = []
        this.cache.pop = () => {
            const popped = Array.prototype.pop.call(this.cache);
            if (popped && this.length < 5000) {
                super.push(popped);
            }
            
            return popped;
        }

        return args.length;
    }
    pop(...args) {
        const popped = super.pop(...args);
        if (popped && this.cache.length < 5000) {
            this.cache.push(popped);
        }

        return popped;
    }
}