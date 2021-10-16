import Tool from "./Tool.js";

export default class extends Tool {
    static id = "curve";

    _size = 4;
    active = false;
    anchorA = null;
    anchorB = null;
    segmentLength = 1;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    init() {
        this.element.style.setProperty("stroke-width", this.size);
    }
    mouseDown() {
        if (this.active) {
            return;
        }

        this.anchorA = this.mouse.pointA;

        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y}`);
        
        this.canvas.layer.base.appendChild(this.element);
    }
    mouseMove() {
        if (this.active) {
            const points = []
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
    mouseUp(event) {
        if (this.active) {
            this.active = false;

            this.element.remove();

            const temp = this.element.cloneNode();
            temp.erase = function(event) {
                const points = this.getAttribute("points").split(",").map(function(point) {
                    const xAndY = point.split(/\s+/g);

                    return {
                        x: parseInt(xAndY[0]),
                        y: parseInt(xAndY[1])
                    }
                });

                return !!points.find((point, index, points) => {
                    if (!points[index - 1]) {
                        return false;
                    }

                    let vector = {
                        x: (parseFloat(points[index - 1].x) - window.canvas.viewBox.x) - (parseFloat(point.x) - window.canvas.viewBox.x),
                        y: (parseFloat(points[index - 1].y) - window.canvas.viewBox.y) - (parseFloat(point.y) - window.canvas.viewBox.y)
                    }
                    let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
                    let b = (event.offsetX - (parseFloat(point.x) - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (parseFloat(point.y) - window.canvas.viewBox.y)) * (vector.y / len);
                    const v = {
                        x: 0,
                        y: 0
                    }

                    if (b <= 0) {
                        v.x = parseFloat(point.x) - window.canvas.viewBox.x;
                        v.y = parseFloat(point.y) - window.canvas.viewBox.y;
                    } else if (b >= len) {
                        v.x = parseFloat(points[index - 1].x) - window.canvas.viewBox.x;
                        v.y = parseFloat(points[index - 1].y) - window.canvas.viewBox.y;
                    } else {
                        v.x = (parseFloat(point.x) - window.canvas.viewBox.x) + vector.x / len * b;
                        v.y = (parseFloat(point.y) - window.canvas.viewBox.y) + vector.y / len * b;
                    }

                    const res = {
                        x: event.offsetX - v.x,
                        y: event.offsetY - v.y
                    }

                    len = Math.sqrt(res.x ** 2 + res.y ** 2);
                    if (len <= window.canvas.tool.size) {
                        this.remove();

                        return true;
                    }

                    return false;
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
            return;
        }
        
        this.anchorB = this.mouse.pointB;

        this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${this.anchorB.x},${this.anchorB.y}`);

        this.active = true;
    }
}