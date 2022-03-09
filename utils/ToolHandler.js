import Line from "../tools/Line.js";
import Brush from "../tools/Brush.js";
import Curve from "../tools/Curve.js";
import Circle from "../tools/Circle.js";
import Ellipse from "../tools/Ellipse.js";
import Rectangle from "../tools/Rectangle.js";
import Text from "../tools/Text.js";
import Eraser from "../tools/Eraser.js";
import Camera from "../tools/Camera.js";
import Select from "../tools/Select.js";

export default class {
    constructor(parent) {
        this.canvas = parent;
        this.registerTool(Line);
        this.registerTool(Brush);
        this.registerTool(Curve);
        this.registerTool(Circle);
        this.registerTool(Ellipse);
        this.registerTool(Rectangle);
        this.registerTool(Text);
        this.registerTool(Eraser);
        this.registerTool(Camera);
        this.registerTool(Select);
    }
    tools = {}
    #selected = "line";
    get selected() {
        return this.get(this.#selected);
    }
    set selected(toolName) {
        if (!this.tools.hasOwnProperty(toolName)) {
            throw new Error(`Hmm. What's a "${toolName}" tool?`);
        }

        if (this.#selected === toolName.toLowerCase()) {
            return;
        }

        this.selected.close();

        this.#selected = toolName.toLowerCase();

        this.selected.init();

        clearTimeout(this.canvas.text.timeout);
		
		this.canvas.view.parentElement.style.cursor = this.#selected === "camera" ? "move" : "default";

		this.canvas.text.innerHTML = this.#selected.charAt(0).toUpperCase() + this.#selected.slice(1);
		this.canvas.text.setAttribute("x", this.canvas.viewBox.width / 2 + this.canvas.viewBox.x - this.canvas.text.innerHTML.length * 2.5);
		this.canvas.text.setAttribute("y", 25 + this.canvas.viewBox.y);
		this.canvas.text.setAttribute("fill", this.canvas.dark ? "#FBFBFB" : "1B1B1B");
		this.canvas.view.appendChild(this.canvas.text);

        const primary = this.canvas.container.querySelector("#primary");
        const secondary = this.canvas.container.querySelector("#secondary");
        if ([
            "line",
            "brush",
            "curve",
            "circle",
            "ellipse",
            "rectangle"
        ].includes(toolName.toLowerCase())) {
            primary.parentElement.style.setProperty("display", "flex");
            secondary.parentElement.style.setProperty("display", "flex");
        } else {
            primary.parentElement.style.setProperty("display", "none");
            secondary.parentElement.style.setProperty("display", "none");
        }
        
		this.canvas.text.timeout = setTimeout(() => {
			this.canvas.text.remove();
		}, 2000);
    }
    get(toolName) {
        return this.tools[toolName.toLowerCase()];
    }
    select(toolName) {
        return this.selected = toolName.toLowerCase();
    }
    isSelected(toolName) {
        return toolName.toLowerCase() === this.selected.toLowerCase();
    }
    registerTool(tool) {
        if (typeof tool !== "function") {
            throw new Error("You seem to have miss placed a function!");
        }

        this.tools[tool.id] = new tool(this);
    }
}