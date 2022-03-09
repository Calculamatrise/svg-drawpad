import Tool from "./Tool.js";

export default class extends Tool {
    static id = "rectangle";

    _size = 4;
    element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    mouseDown() {
        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("fill", this.canvas.fill ? this.canvas.primary : "#FFFFFF00");
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("x", this.mouse.pointA.x);
        this.element.setAttribute("y", this.mouse.pointA.y);
        this.element.setAttribute("width", 1);
        this.element.setAttribute("height", 1);
        this.element.setAttribute("rx", .5);
        
        this.canvas.layer.base.appendChild(this.element);
    }
    mouseMove() {
        if (this.mouse.position.x - this.mouse.pointA.x > 0) {
            this.element.setAttribute("x", this.mouse.pointA.x);
            this.element.setAttribute("width", this.mouse.position.x - this.mouse.pointA.x);
        } else {
            this.element.setAttribute("x", this.mouse.position.x);
            this.element.setAttribute("width", this.mouse.pointA.x - this.mouse.position.x);
        }

        if (this.mouse.position.y - this.mouse.pointA.y > 0) {
            this.element.setAttribute("y", this.mouse.pointA.y);
            this.element.setAttribute("height", this.mouse.position.y - this.mouse.pointA.y);
        } else {
            this.element.setAttribute("y", this.mouse.position.y);
            this.element.setAttribute("height", this.mouse.pointA.y - this.mouse.position.y);
        }
    }
    mouseUp() {
        this.element.remove();
        if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return;
        }

        const rectangle = this.element.cloneNode();
        rectangle.erase = function(event) {
            const points = [
                {
                    x: +this.getAttribute("x"),
                    y: +this.getAttribute("y")
                },
                {
                    x: +this.getAttribute("x"),
                    y: +this.getAttribute("y") + this.getAttribute("height")
                },
                {
                    x: +this.getAttribute("x") + this.getAttribute("width"),
                    y: +this.getAttribute("y") + this.getAttribute("height")
                },
                {
                    x: +this.getAttribute("x") + this.getAttribute("width"),
                    y: +this.getAttribute("y")
                },
                {
                    x: +this.getAttribute("x"),
                    y: +this.getAttribute("y")
                }
            ];

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
            this.canvas.layer.base.appendChild(rectangle);
        }

        this.canvas.layer.lines.push(rectangle);
        this.canvas.events.push({
            action: "add",
            value: rectangle
        });
    }
}