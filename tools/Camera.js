import Tool from "./Tool.js";

export default class extends Tool {
    mouseMove(event) {
        this.canvas.view.setAttribute("viewBox", `${this.canvas.viewBox.x - event.movementX * this.canvas.zoom} ${this.canvas.viewBox.y - event.movementY * this.canvas.zoom} ${this.canvas.viewBox.width} ${this.canvas.viewBox.height}`);
        this.canvas.text.setAttribute("x", this.canvas.viewBox.width / 2 - this.canvas.text.innerHTML.length * 2 + this.canvas.viewBox.x);
        this.canvas.text.setAttribute("y", 25 + this.canvas.viewBox.y);
    }
}