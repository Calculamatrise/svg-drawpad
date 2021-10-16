import Tool from "./Tool.js";

export default class extends Tool {
    static id = "text";

    active = false;
    element = document.createElementNS("http://www.w3.org/2000/svg", "text");
    mouseDown() {
        if (this.active) {
            return;
        }

        this.active = true;

        this.element.remove();

        const text = this.element.cloneNode();
        
        this.canvas.layer.base.appendChild(text);
    }
    mouseMove() {
        // make sure it works without having to press down.

        this.element.style.setProperty("fill", this.canvas.fill ? this.canvas.primary : "#FFFFFF00");
        this.element.setAttribute("x", this.mouse.pointA.x);
        this.element.setAttribute("y", this.mouse.pointA.y);
        this.canvas.layer.base.appendChild(this.element);
    }
    mouseUp() {
        if (this.active) {
            this.active = false;

            return;
        }

        // add event listener to type the actual text.
    }
    recordKeys(event) {
        this.element.innerText += event.key;
    }
}