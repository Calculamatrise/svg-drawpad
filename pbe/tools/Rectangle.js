import Tool from "./Tool.js";

export default class extends Tool {
    static id = "rectangle";

    size = 4;
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
            let vector = {
                x: (parseInt(this.getAttribute("width")) + parseInt(this.getAttribute("x")) - window.canvas.viewBox.x) - (parseInt(this.getAttribute("x")) - window.canvas.viewBox.x),
                y: (parseInt(this.getAttribute("height")) + parseInt(this.getAttribute("y")) - window.canvas.viewBox.y) - (parseInt(this.getAttribute("y")) - window.canvas.viewBox.y)
            }
            let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
            let b = (event.offsetX - (parseInt(this.getAttribute("x")) - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (parseInt(this.getAttribute("y")) - window.canvas.viewBox.y)) * (vector.y / len);
            const v = {
                x: 0,
                y: 0
            }

            if (b <= 0) {
                v.x = parseInt(this.getAttribute("x")) - window.canvas.viewBox.x;
                v.y = parseInt(this.getAttribute("y")) - window.canvas.viewBox.y;
            } else if (b >= len) {
                v.x = parseInt(this.getAttribute("width")) + parseInt(this.getAttribute("x")) - window.canvas.viewBox.x;
                v.y = parseInt(this.getAttribute("height")) + parseInt(this.getAttribute("y")) - window.canvas.viewBox.y;
            } else {
                v.x = (parseInt(this.getAttribute("x")) - window.canvas.viewBox.x) + vector.x / len * b;
                v.y = (parseInt(this.getAttribute("y")) - window.canvas.viewBox.y) + vector.y / len * b;
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
        }
        rectangle.toString = function() {
            return `rectangle:${this.getAttribute("x")}-${this.getAttribute("y")}-${this.getAttribute("width")}-${this.getAttribute("height")}.`
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