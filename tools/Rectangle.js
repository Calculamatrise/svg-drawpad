import Tool from "./Tool.js";

export default class extends Tool {
    _size = 4;
    element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    arc(anchorA, anchorB) {
        let points = []
        for (let i = 0; i < 1; i += this.segmentLength / 100) {
            points.push([
                Math.pow((1 - i), 2) * anchorA.x + 2 * (1 - i) * i * anchorB.x + Math.pow(i, 2) * this.anchorB.x,
                Math.pow((1 - i), 2) * anchorA.y + 2 * (1 - i) * i * anchorB.position.y + Math.pow(i, 2) * this.anchorB.y
            ]);
        }

        return points;
    }

    roundedRect() {}

    press() {
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

    stroke() {
        this.element.setAttribute("x", Math.min(this.mouse.pointA.x, this.mouse.position.x));
        this.element.setAttribute("y", Math.min(this.mouse.pointA.y, this.mouse.position.y));
        this.element.setAttribute("width", Math.abs(this.mouse.position.x - this.mouse.pointA.x));
        this.element.setAttribute("height", Math.abs(this.mouse.position.y - this.mouse.pointA.y));
    }

    clip() {
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
                    y: +this.getAttribute("y") + +this.getAttribute("height")
                },
                {
                    x: +this.getAttribute("x") + +this.getAttribute("width"),
                    y: +this.getAttribute("y") + +this.getAttribute("height")
                },
                {
                    x: +this.getAttribute("x") + +this.getAttribute("width"),
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

        this.canvas.layer.push(rectangle);
        this.canvas.events.push({
            action: "add",
            value: rectangle
        });
    }
}