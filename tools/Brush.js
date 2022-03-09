import Tool from "./Tool.js";

export default class extends Tool {
    static id = "brush";

    _size = 4;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    init() {
        this.element.style.setProperty("stroke-width", this.size);
    }
    mouseDown() {
        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("fill", "transparent");
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", `${this.mouse.pointA.x},${this.mouse.pointA.y}`);
        
        this.canvas.layer.base.appendChild(this.element);
    }
    mouseMove() {
        if (this.mouse.pointA.x === this.mouse.position.x && this.mouse.pointA.y === this.mouse.position.y) {
            return;
        }

        this.element.setAttribute("points", `${this.element.getAttribute("points")} ${this.mouse.position.x},${this.mouse.position.y}`);
    }
    mouseUp(event) {
        this.element.remove();
        if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return;
        }
        
        const temp = this.element.cloneNode();
        temp.erase = function(event) {
            const points = this.getAttribute("points").split(/\s+/g).map(function(point) {
                const [ x, y ] = point.split(",");
                return {
                    x: parseInt(x),
                    y: parseInt(y)
                }
            });

            return !!points.find((point, index, points) => {
                if (!points[index - 1]) {
                    return false;
                }

                let vector = {
                    x: (parseInt(points[index - 1].x) - window.canvas.viewBox.x) - (parseInt(point.x) - window.canvas.viewBox.x),
                    y: (parseInt(points[index - 1].y) - window.canvas.viewBox.y) - (parseInt(point.y) - window.canvas.viewBox.y)
                }

                let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
                let b = (event.offsetX - (parseInt(point.x) - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (parseInt(point.y) - window.canvas.viewBox.y)) * (vector.y / len);
                if (b >= len) {
                    vector.x = event.offsetX - parseInt(points[index - 1].x) - window.canvas.viewBox.x;
                    vector.y = event.offsetY - parseInt(points[index - 1].y) - window.canvas.viewBox.y;
                } else {
                    let { x, y } = window.structuredClone(vector);
                    vector.x = event.offsetX - point.x - window.canvas.viewBox.x;
                    vector.y = event.offsetY - point.y - window.canvas.viewBox.y;
                    if (b > 0) {
                        vector.x -= x / len * b;
                        vector.y -= y / len * b;
                    }
                }
    
                len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
                
                return len - +this.style.getPropertyValue("stroke-width") / 2 <= window.canvas.tool.size && !this.remove();
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
    }
    close() {
        this.element.remove();
    }
}