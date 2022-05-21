import Tool from "./Tool.js";

export default class extends Tool {
    _size = 4;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    init() {
        this.element.style.setProperty("stroke-width", this.size);
    }
    
    press() {
        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("fill", "transparent");
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", `${this.mouse.pointA.x},${this.mouse.pointA.y}`);
        
        this.canvas.layer.base.appendChild(this.element);
    }

    stroke() {
        if (this.mouse.pointA.x === this.mouse.position.x && this.mouse.pointA.y === this.mouse.position.y) {
            return;
        }

        this.element.setAttribute("points", `${this.element.getAttribute("points")} ${this.mouse.position.x},${this.mouse.position.y}`);
    }

    clip(event) {
        this.element.remove();
        if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return;
        }
        
        const temp = this.element.cloneNode();
        temp.erase = function(event) {
            const points = this.getAttribute("points").split(/\s+/g).map(function(point) {
                const [ x, y ] = point.split(",").map(value => +value);
                return {
                    x,
                    y
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

        this.canvas.layer.push(temp);
        this.canvas.events.push({
            action: "add",
            value: temp
        });
    }
    
    close() {
        this.element.remove();
    }
}