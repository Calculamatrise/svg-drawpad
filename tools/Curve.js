import Tool from "./Tool.js";

export default class extends Tool {
    _size = 4;
    active = false;
    anchorA = null;
    anchorB = null;
    segmentLength = 1;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    init() {
        this.element.style.setProperty("stroke-width", this.size);
    }

    press() {
        if (this.active) {
            return;
        }

        this.anchorA = this.mouse.pointA;

        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y}`);
        
        this.canvas.layer.base.appendChild(this.element);
    }
    
    stroke() {
        if (this.active) {
            const points = [];
            for (let i = 0; i < 1; i += this.segmentLength / 100) {
                points.push([
                    Math.pow((1 - i), 2) * this.anchorA.x + 2 * (1 - i) * i * this.mouse.position.x + Math.pow(i, 2) * this.anchorB.x,
                    Math.pow((1 - i), 2) * this.anchorA.y + 2 * (1 - i) * i * this.mouse.position.y + Math.pow(i, 2) * this.anchorB.y
                ]);
            }

            this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${points.map(point => point.join(",")).join(" ")} ${this.anchorB.x},${this.anchorB.y}`);

            return;
        } else if (this.mouse.isDown && !this.mouse.isAlternate) {
            this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${this.mouse.position.x},${this.mouse.position.y}`);
        }
    }

    clip() {
        if (this.active) {
            this.active = false;

            this.anchorA = null;
            this.anchorB = null;
            this.element.remove();

            const temp = this.element.cloneNode();
            temp.erase = function(event) {
                const points = this.getAttribute("points").split(/\s+/g).map(function(point) {
                    // Object.fromEntries
                    const [ x, y ] = point.split(",").map(value => +value);
                    return {
                        x, y
                    }
                });
    
                return !!points.find((point, index, points) => {
                    if (!points[index - 1]) {
                        return false;
                    }
    
                    let vector = {
                        x: points[index - 1].x - window.canvas.viewBox.x - point.x - window.canvas.viewBox.x,
                        y: points[index - 1].y - window.canvas.viewBox.y - point.y - window.canvas.viewBox.y
                    }
    
                    let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
                    let b = -(point.x - window.canvas.viewBox.x - event.offsetX) * (vector.x / len) - (point.y - window.canvas.viewBox.y - event.offsetY) * (vector.y / len);
                    if (b >= len) {
                        vector.x = points[index - 1].x - window.canvas.viewBox.x - event.offsetX;
                        vector.y = points[index - 1].y - window.canvas.viewBox.y - event.offsetY;
                    } else {
                        let { x, y } = window.structuredClone(vector);
                        vector.x = point.x - window.canvas.viewBox.x - event.offsetX;
                        vector.y = point.y - window.canvas.viewBox.y - event.offsetY;
                        if (b > 0) {
                            vector.x += x / len * b;
                            vector.y += y / len * b;
                        }
                    }
    
                    return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue("stroke-width") / 2 <= window.canvas.tool.size && !this.remove();
                });
            }
        
            if (!this.canvas.layer.hidden) {
                this.canvas.layer.base.appendChild(temp);
            }

            this.canvas.layer.lines.push(temp);
            this.canvas.events.push({
                action: "add",
                value: temp
            });

            return;
        } else if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return this.element.remove();
        }

        this.active = true;
        this.anchorB = this.mouse.pointB;
        this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${this.anchorB.x},${this.anchorB.y}`);
    }
}