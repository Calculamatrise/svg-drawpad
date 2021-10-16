import Tool from "./Tool.js";

export default class extends Tool {
    static id = "camera";
    mouseMove(event) {
        this.canvas.view.setAttribute("viewBox", `${this.canvas.viewBox.x - event.movementX} ${this.canvas.viewBox.y - event.movementY} ${window.innerWidth} ${window.innerHeight}`);
        this.canvas.text.setAttribute("x", this.canvas.view.width.baseVal.value / 2 - this.canvas.text.innerHTML.length * 2 + this.canvas.viewBox.x);
        this.canvas.text.setAttribute("y", 25 + this.canvas.viewBox.y);
    }
}