import Tool from "./Tool.js";

export default class extends Tool {
    _size = 20;
    element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    init() {
        this.element.setAttribute("opacity", .8);
        this.element.setAttribute("fill", "khaki");
        this.element.setAttribute("cx", this.mouse.position.x);
        this.element.setAttribute("cy", this.mouse.position.y);
        this.element.setAttribute("r", this.size);
        
        this.canvas.view.appendChild(this.element);
    }

    press(event) {
        this.canvas.layer.lines.filter(line => !!line.parentElement).forEach(line => {
            if (line.erase(event)) {
                this.canvas.events.push({
                    action: "remove",
                    value: line
                });
            }
        });
    }
    
    stroke(event) {
        this.element.setAttribute("cx", this.mouse.position.x);
        this.element.setAttribute("cy", this.mouse.position.y);
        if (this.mouse.isDown && !this.mouse.isAlternate) {
            this.canvas.layer.lines.filter(line => !!line.parentElement).forEach(line => {
                if (line.erase(event)) {
                    this.canvas.events.push({
                        action: "remove",
                        value: line
                    });
                }
            });
        }
    }

    close() {
        this.element.remove();
    }
}