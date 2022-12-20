import Tool from "./Tool.js";

export default class extends Tool {
    active = false;
    selected = []
    cache = []
    secondaryCache = []
    clipboard = []
    element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    press(event) {
        if (this.active) {
            this.cache = this.selected.map(function(line) {
                return line.cloneNode();
            });
            
            return;
        }

        this.element.style.setProperty("stroke", "#87CEEB");
        this.element.style.setProperty("fill", "#87CEEB80");
        this.element.style.setProperty("stroke-width", 2);
        this.element.setAttribute("x", this.mouse.pointA.x);
        this.element.setAttribute("y", this.mouse.pointA.y);
        this.element.setAttribute("width", 0);
        this.element.setAttribute("height", 0);
        this.element.setAttribute("rx", .5);
        
        this.canvas.view.appendChild(this.element);
    }
    
    stroke(event) {
        if (this.active) {
            this.canvas.view.style.setProperty("cursor", "move");
            this.selected.map(function(line) {
                let type = parseInt(line.getAttribute("x")) ? 0 : parseInt(line.getAttribute("x1")) ? 1 : parseInt(line.getAttribute("cx")) ? 2 : parseInt(line.getAttribute("points")) ? 3 : NaN;
                if (isNaN(type)) {
                    return;
                }

                switch(type) {
                    case 0:
                        line.setAttribute("x", parseInt(line.getAttribute("x")) + event.movementX);
                        line.setAttribute("y", parseInt(line.getAttribute("y")) + event.movementY);

                        break;

                    case 1:
                        line.setAttribute("x1", parseInt(line.getAttribute("x1")) + event.movementX);
                        line.setAttribute("y1", parseInt(line.getAttribute("y1")) + event.movementY);
                        line.setAttribute("x2", parseInt(line.getAttribute("x2")) + event.movementX);
                        line.setAttribute("y2", parseInt(line.getAttribute("y2")) + event.movementY);

                        break;

                    case 2:
                        line.setAttribute("cx", parseInt(line.getAttribute("cx")) + event.movementX);
                        line.setAttribute("cy", parseInt(line.getAttribute("cy")) + event.movementY);

                        break;

                    case 3:
                        line.setAttribute("points", line.getAttribute("points").split(/\s+/g).map(function(coord) {
                            coord = coord.split(/\u002C/g).map(value => parseInt(value));
                            coord[0] += event.movementX
                            coord[1] += event.movementY

                            return coord.join(",");
                        }).join(" "));

                        break;
                }
            });

            return;
        }

        this.element.setAttribute("x", Math.min(this.mouse.pointA.x, this.mouse.position.x));
        this.element.setAttribute("y", Math.min(this.mouse.pointA.y, this.mouse.position.y));
        this.element.setAttribute("width", Math.abs(this.mouse.position.x - this.mouse.pointA.x));
        this.element.setAttribute("height", Math.abs(this.mouse.position.y - this.mouse.pointA.y));
    }

    clip(event) {
        if (this.active) {
            this.deselect();

            this.secondaryCache = this.selected.map(function(line) {
                return line.cloneNode();
            });

            this.canvas.events.push({
                action: "move_selected",
                data: {
                    selected: this.selected,
                    cache: this.cache,
                    secondaryCache: this.secondaryCache
                }
            });

            return;
        }

        this.deselect();
        this.element.remove();
        
        this.selected = this.canvas.layer.lines.filter(line => !!line.parentElement).filter((line) => {
            let strokePoints = (line.getAttribute("points") || "").split(/\u002C/g);
            let passing = false;
            let points = [
                parseInt(line.getAttribute("x")),
                parseInt(line.getAttribute("x1")),
                parseInt(line.getAttribute("x2")),
                parseInt(line.getAttribute("cx")),
                ...strokePoints.map(coord => parseInt(coord.split(/\s+/g)[0]))
            ].filter(point => isFinite(point));
            if (this.mouse.position.x - this.mouse.pointA.x > 0) {
                passing = !!points.find((point) => point > this.mouse.pointA.x && point < this.mouse.position.x);
            } else {
                passing = !!points.find((point) => point > this.mouse.position.x && point < this.mouse.pointA.x);
            }

            points = [
                parseInt(line.getAttribute("y")),
                parseInt(line.getAttribute("y1")),
                parseInt(line.getAttribute("y2")),
                parseInt(line.getAttribute("cy")),
                ...strokePoints.map(coord => parseInt(coord.split(/\s+/g)[1]))
            ].filter(point => isFinite(point));
            if (passing) {
                if (this.mouse.position.y - this.mouse.pointA.y > 0) {
                    passing = !!points.find((point) => point > this.mouse.pointA.y && point < this.mouse.position.y);
                } else {
                    passing = !!points.find((point) => point > this.mouse.position.y && point < this.mouse.pointA.y);
                }
            }

            return passing;
        });

        for (const line of this.selected) {
            line.classList.add("highlighted");
        }

        if (this.selected.length > 0) {
            this.active = true;
        }
    }

    copy() {
        clearTimeout(this.parent.this.canvas.text.timeout);
		this.clipboard.push(...this.selected.map(function(line) {
            line.classList.remove("highlighted");
			return line.cloneNode();
		}));

		this.selected = []

		this.parent.this.canvas.text.innerHTML = "Selection copied!";
		this.parent.this.canvas.view.appendChild(this.parent.this.canvas.text);

		this.parent.this.canvas.text.timeout = setTimeout(() => {
			this.parent.this.canvas.text.remove();
		}, 2000);
    }

    paste() {
        clearTimeout(this.parent.this.canvas.text.timeout);
		if (this.constructor.id === "select") {
			this.parent.this.canvas.text.innerHTML = "Selection pasted!";
			this.parent.this.canvas.view.appendChild(this.parent.this.canvas.text);

			this.parent.this.canvas.text.timeout = setTimeout(() => {
				this.parent.this.canvas.text.remove();
			}, 2000);

			this.parent.this.canvas.layer.push(...this.clipboard);
			this.clipboard = []
            return;
		}

		this.parent.this.canvas.text.innerHTML = "Select tool must be active to paste!";
		this.parent.this.canvas.view.appendChild(this.parent.this.canvas.text);
		this.parent.this.canvas.text.timeout = setTimeout(() => {
			this.parent.this.canvas.text.remove();
		}, 2000);
    }

    deselect() {
        for (const line of this.selected) {
            line.classList.remove("highlighted");
        }

        this.active = false;
    }

    close() {
        this.deselect();
        this.element.remove();
    }
}