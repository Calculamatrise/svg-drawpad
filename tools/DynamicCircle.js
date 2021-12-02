import Tool from "./Tool.js";

export default class extends Tool {
    static id = "dynamic_circle";

    _size = 4;
    color = null;
    segmentLength = 5;
    element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    get current() {
        const lines = [];
        for (let i = 0; i <= 360; i += this.segmentLength) {
            const temp = document.createElementNS("http://www.w3.org/2000/svg", "line");
            temp.style.setProperty("stroke", this.color);
            temp.style.setProperty("stroke-width", this.size);
            temp.setAttribute("x1", this.x + this.width * Math.cos(i * Math.PI / 180));
            temp.setAttribute("y1", this.y + this.height * Math.sin(i * Math.PI / 180));
            temp.setAttribute("x2", this.x + this.width * Math.cos((i + this.segmentLength) * Math.PI / 180));
            temp.setAttribute("y2", this.y + this.height * Math.sin((i + this.segmentLength) * Math.PI / 180));
            temp.erase = function(event) {
                let vector = {
                    x: (parseInt(this.getAttribute("x2")) - window.canvas.viewBox.x) - (parseInt(this.getAttribute("x1")) - window.canvas.viewBox.x),
                    y: (parseInt(this.getAttribute("y2")) - window.canvas.viewBox.y) - (parseInt(this.getAttribute("y1")) - window.canvas.viewBox.y)
                }
                let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
                let b = (event.offsetX - (parseInt(this.getAttribute("x1")) - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (parseInt(this.getAttribute("y1")) - window.canvas.viewBox.y)) * (vector.y / len);
                const v = {
                    x: 0,
                    y: 0
                }
    
                if (b <= 0) {
                    v.x = parseInt(this.getAttribute("x1")) - window.canvas.viewBox.x;
                    v.y = parseInt(this.getAttribute("y1")) - window.canvas.viewBox.y;
                } else if (b >= len) {
                    v.x = parseInt(this.getAttribute("x2")) - window.canvas.viewBox.x;
                    v.y = parseInt(this.getAttribute("y2")) - window.canvas.viewBox.y;
                } else {
                    v.x = (parseInt(this.getAttribute("x1")) - window.canvas.viewBox.x) + vector.x / len * b;
                    v.y = (parseInt(this.getAttribute("y1")) - window.canvas.viewBox.y) + vector.y / len * b;
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

            lines.push(temp);
        }

        return lines;
    }
    get x() {
        if (this.mouse.position.x - this.mouse.pointA.x > 0) {
            return this.mouse.pointA.x + this.width;
        }
        
        return this.mouse.position.x + this.width;
    }
    get y() {
        if (this.mouse.position.y - this.mouse.pointA.y > 0) {
            return this.mouse.pointA.y + this.height;
        }

        return this.mouse.position.y + this.height;
    }
    get width() {
        if (this.mouse.position.x - this.mouse.pointA.x > 0) {
            return (this.mouse.position.x - this.mouse.pointA.x) / 2;
        }
        
        return (this.mouse.pointA.x - this.mouse.position.x) / 2;
    }
    get height() {
        if (this.mouse.position.y - this.mouse.pointA.y > 0) {
            return (this.mouse.position.y - this.mouse.pointA.y) / 2;
        }
        
        return (this.mouse.pointA.y - this.mouse.position.y) / 2;
    }
    init() {
        this.element.style.setProperty("stroke", this.color = this.canvas.primary);
        this.element.style.setProperty("fill", this.canvas.fill ? this.canvas.primary : "#FFFFFF00");
        this.element.style.setProperty("stroke-width", this.size);
    }
    mouseDown() {
        this.element.style.setProperty("stroke", this.color = this.canvas.primary);
        this.element.style.setProperty("fill", this.canvas.fill ? this.canvas.primary : "#FFFFFF00");
        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", "");

        this.canvas.layer.base.appendChild(this.element);
    }
    mouseMove() {
        const points = []
        for (let i = 0; i <= 360; i += this.segmentLength/*1000 / (this.width / 2 + this.height / 2) / 2 / 10*/) {
            points.push([
                this.x + this.width * Math.cos(i * Math.PI / 180),
                this.y + this.height * Math.sin(i * Math.PI / 180)
            ]);
        }

        this.element.style.setProperty("stroke-width", this.size);
        this.element.setAttribute("points", points.map(point => point.join(",")).join(" "));
    }
    mouseUp() {
        this.element.remove();
        if (this.mouse.pointA.x === this.mouse.pointB.x && this.mouse.pointA.y === this.mouse.pointB.y) {
            return;
        }
        
        const circle = this.current// this.element.cloneNode();
        circle.erase = function(event) {
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
                    x: (parseInt(points[index - 1].x) - window.canvas.viewBox.x) - (parseInt(point.x) - window.canvas.viewBox.x),
                    y: (parseInt(points[index - 1].y) - window.canvas.viewBox.y) - (parseInt(point.y) - window.canvas.viewBox.y)
                }
                let len = Math.sqrt(vector.x ** 2 + vector.y ** 2);
                let b = (event.offsetX - (parseInt(point.x) - window.canvas.viewBox.x)) * (vector.x / len) + (event.offsetY - (parseInt(point.y) - window.canvas.viewBox.y)) * (vector.y / len);
                const v = {
                    x: 0,
                    y: 0
                }

                if (b <= 0) {
                    v.x = parseInt(point.x) - window.canvas.viewBox.x;
                    v.y = parseInt(point.y) - window.canvas.viewBox.y;
                } else if (b >= len) {
                    v.x = parseInt(points[index - 1].x) - window.canvas.viewBox.x;
                    v.y = parseInt(points[index - 1].y) - window.canvas.viewBox.y;
                } else {
                    v.x = (parseInt(point.x) - window.canvas.viewBox.x) + vector.x / len * b;
                    v.y = (parseInt(point.y) - window.canvas.viewBox.y) + vector.y / len * b;
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
            this.canvas.layer.base.append(...circle);
        }

        this.canvas.layer.lines.push(...circle);
        this.canvas.events.push({
            action: "add",
            value: circle
        });
    }
}