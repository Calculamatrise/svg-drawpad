import Tool from "./Tool.js";

export default class extends Tool {
    _size = 4;
    element = document.createElementNS("http://www.w3.org/2000/svg", "line");
    init() {
        this.element.style.setProperty("stroke-width", this.size);
    }

    mouseDown(event) {
        this.active = true;

        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("x1", this.mouse.pointA.x);
        this.element.setAttribute("y1", this.mouse.pointA.y);
        this.element.setAttribute("x2", this.mouse.position.x);
        this.element.setAttribute("y2", this.mouse.position.y);

        this.canvas.layer.base.appendChild(this.element);
    }

    mouseMove(event) {
        if (!this.active) {
            return;
        }

        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("x2", this.mouse.position.x);
        this.element.setAttribute("y2", this.mouse.position.y);
    }

    mouseUp(event) {
        if (!this.active) {
            return;
        }

        this.active = false;

        this.element.remove();
        if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return;
        }

        const line = this.element.cloneNode();
        line.setAttribute("x2", this.mouse.pointB.x);
        line.setAttribute("y2", this.mouse.pointB.y);
        line.erase = function(event) {
            let vector = {
                x: this.getAttribute("x2") - this.getAttribute("x1"),
                y: this.getAttribute("y2") - this.getAttribute("y1")
            }

            let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
            let b = (event.offsetX - window.canvas.viewBox.x - this.getAttribute("x1")) * (vector.x / len) + (event.offsetY - window.canvas.viewBox.y - this.getAttribute("y1")) * (vector.y / len);
            if (b >= len) {
                vector.x = this.getAttribute("x2") - event.offsetX - window.canvas.viewBox.x;
                vector.y = this.getAttribute("y2") - event.offsetY - window.canvas.viewBox.y;
            } else {
                let { x, y } = window.structuredClone(vector);
                vector.x = this.getAttribute("x1") - event.offsetX - window.canvas.viewBox.x;
                vector.y = this.getAttribute("y1") - event.offsetY - window.canvas.viewBox.y;
                if (b > 0) {
                    vector.x += x / len * b;
                    vector.y += y / len * b;
                }
            }

            return Math.sqrt(vector.x ** 2 + vector.y ** 2) - this.style.getPropertyValue("stroke-width") / 2 <= window.canvas.tool.size && !this.remove();
        }

        if (!this.canvas.layer.hidden) {
            this.canvas.layer.base.appendChild(line);
        }

        this.canvas.layer.lines.push(line);
        this.canvas.events.push({
            action: "add",
            value: line
        });
    }

    close() {
        this.active = false;
        
        this.element.remove();
    }
}