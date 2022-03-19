import Tool from "./Tool.js";

export default class extends Tool {
    _size = 4;
    stage = 0;
    active = false;
    anchorA = null;
    anchorB = null;
    control = null;
    segmentLength = 1;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    init() {
        this.element.style.setProperty("stroke-width", this.size);
    }

    bezier(t, p0, p1, p2, p3) {
        let cX = 3 * (p1.x - p0.x);
        let bX = 3 * (p2.x - p1.x) - cX;
      
        let cY = 3 * (p1.y - p0.y);
        let bY = 3 * (p2.y - p1.y) - cY;

        return [
            ((p3.x - p0.x - cX - bX) * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x,
            ((p3.y - p0.y - cY - bY) * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y
        ]
    }

    press() {
        if (this.active) {
            return;
        }

        this.anchorA = this.mouse.pointA;

        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y}`);
        
        this.canvas.layer.base.appendChild(this.element);
    }
    
    stroke() {
        if (this.active) {
            const points = [];
            for (let i = 0; i < 1; i += this.segmentLength / 100) {
                points.push(this.bezier(i, this.anchorA, this.control || this.mouse.position, this.mouse.position, this.anchorB));
            }

            this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${points.map(point => point.join(",")).join(" ")} ${this.anchorB.x},${this.anchorB.y}`);

            return;
        } else if (this.mouse.isDown && !this.mouse.isAlternate) {
            this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${this.mouse.position.x},${this.mouse.position.y}`);
        }
    }

    clip() {
        if (this.active && this.stage > 1) {
            this.stage = +(this.active = false);

            this.anchorA = null;
            this.anchorB = null;
            this.control = null;
            this.element.remove();

            const temp = this.element.cloneNode();
            temp.erase = function(event) {
                const points = this.getAttribute("points").split(/\s+/g).map(function(point) {
                    const [ x, y ] = point.split(",").map(value => +value);
                    return {
                        x, y
                    }
                });
    
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
        
            if (!this.canvas.layer.hidden) {
                this.canvas.layer.base.appendChild(temp);
            }

            this.canvas.layer.lines.push(temp);
            this.canvas.events.push({
                action: "add",
                value: temp
            });

            return;
        } else if (this.active && this.stage === 1) {
            this.control = this.mouse.position;
            this.stage++;
            return;
        } else if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return this.element.remove();
        }

        this.stage++;
        this.active = true;
        this.anchorB = this.mouse.pointB;
        this.element.setAttribute("points", `${this.anchorA.x},${this.anchorA.y} ${this.anchorB.x},${this.anchorB.y}`);
    }
}