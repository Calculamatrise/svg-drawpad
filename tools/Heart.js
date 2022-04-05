import Tool from "./Tool.js";

export default class extends Tool {
    _size = 4;
    color = null;
    segmentLength = 5;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    get width() {        
        return Math.sqrt((this.mouse.position.x - this.mouse.pointA.x) ** 2);
    }

    get height() {        
        return Math.sqrt((this.mouse.position.y - this.mouse.pointA.y) ** 2);
    }

    init() {
        this.element.style.setProperty("stroke", this.color = this.canvas.primary);
        this.element.style.setProperty("fill", this.canvas.fill ? this.canvas.primary : "#FFFFFF00");
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

    drawHeart(x, y, width, height) {
        let topCurveHeight = height * 0.3;

        const points = [];
        for (let i = 0; i < 1; i += this.segmentLength / 100) {
            // top left curve
            points.push(this.bezier(i, { x, y: y + topCurveHeight },
                { x, y },
                { x: x - width, y },
                { x: x - width, y: y + topCurveHeight }
            ));
        }

        for (let i = 0; i < 1; i += this.segmentLength / 100) {
            // bottom left curve
            points.push([
                Math.pow((1 - i), 2) * (x - width) + 2 * (1 - i) * i * (x - width) + Math.pow(i, 2) * x,
                Math.pow((1 - i), 2) * (y + topCurveHeight) + 2 * (1 - i) * i * (y + (height + topCurveHeight) / 2) + Math.pow(i, 2) * (y + height)
            ]);

            // style 2 - dripping
            // points.push(this.bezier(i, { x: x - width, y: y + topCurveHeight },
            //     { x: x - width, y: y + (height + topCurveHeight) / 2 },
            //     { x, y: y + (height + topCurveHeight) / 2 },
            //     { x, y: y + height }
            // ));
        }

        for (let i = 0; i < 1; i += this.segmentLength / 100) {
            // bottom right curve
            points.push([
                Math.pow((1 - i), 2) * x + 2 * (1 - i) * i * (x + width) + Math.pow(i, 2) * (x + width),
                Math.pow((1 - i), 2) * (y + height) + 2 * (1 - i) * i * (y + (height + topCurveHeight) / 2) + Math.pow(i, 2) * (y + topCurveHeight)
            ]);

            // style 2 - dripping
            // points.push(this.bezier(i, { x, y: y + height },
            //     { x, y: y + (height + topCurveHeight) / 2 },
            //     { x: x + width, y: y + (height + topCurveHeight) / 2 },
            //     { x: x + width, y: y + topCurveHeight }
            // ));
        }

        for (let i = 0; i < 1; i += this.segmentLength / 100) {
            // top right curve
            points.push(this.bezier(i, { x: x + width, y: y + topCurveHeight },
                { x: x + width, y },
                { x, y },
                { x, y: y + topCurveHeight }
            ));
        }

        points.push(points[0]);

        return points;
    }

    press() {
        this.element.style.setProperty("stroke", this.canvas.primary);
        this.element.style.setProperty("fill", this.canvas.fill ? this.canvas.primary : "#FFFFFF00");
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", `${this.mouse.pointA.x},${this.mouse.pointA.y}`);

        this.canvas.layer.base.appendChild(this.element);
    }

    stroke() {
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", this.drawHeart(this.mouse.pointA.x, Math.min(this.mouse.position.y, this.mouse.pointA.y), this.width, this.height));
    }
    
    clip() {
        this.element.remove();
        if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return;
        }
        
        const temp = this.element.cloneNode();
        temp.erase = function(event) {
            let vector = {
                x: this.getAttribute("cx") - window.canvas.viewBox.x - event.offsetX,
                y: this.getAttribute("cy") - window.canvas.viewBox.y - event.offsetY
            }

            return Math.sqrt(vector.x ** 2 / (+this.getAttribute("rx") + this.style.getPropertyValue("stroke-width") / 2 + window.canvas.tool.size) ** 2 + vector.y ** 2 / (+this.getAttribute("ry") + this.style.getPropertyValue("stroke-width") / 2 + window.canvas.tool.size) ** 2) <= 1 && (Math.sqrt(vector.x ** 2 / (+this.getAttribute("rx") - this.style.getPropertyValue("stroke-width") / 2 - window.canvas.tool.size) ** 2 + vector.y ** 2 / (+this.getAttribute("ry") - this.style.getPropertyValue("stroke-width") / 2 - window.canvas.tool.size) ** 2) >= 1 || this.getAttribute("rx") < window.canvas.tool.size || this.getAttribute("ry") < window.canvas.tool.size) && !this.remove();
        }

        if (!this.canvas.layer.hidden) {
            this.canvas.layer.base.append(temp);
        }

        this.canvas.layer.lines.push(temp);
        this.canvas.events.push({
            action: "add",
            value: temp
        });
    }
}