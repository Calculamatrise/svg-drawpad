import Canvas from "./utils/Canvas.js";

window.canvas = new Canvas(document.querySelector("#view"));

container.addEventListener("contextmenu", function(event) {
	event.preventDefault();
});

document.querySelector("#patch-notes").addEventListener("click", function(event) {
	if (this.iframe) {
		this.iframe.remove();

		this.iframe = null;

		return;
	}

	this.iframe = document.createElement("iframe");
	this.iframe.id = "patch-notes-iframe";
	this.iframe.className = "overlay";
	this.iframe.src = location.origin + "/svg/drawpad/updates/patch-1.2.5/";

	document.querySelector("#container").appendChild(this.iframe);
});

if (JSON.parse(localStorage.getItem("dark")) ?? window.matchMedia('(prefers-color-scheme: dark)').matches) {
	document.documentElement.style.setProperty("--background", "#1B1B1B");
	document.documentElement.style.setProperty("--hard-background", "#111111");
	document.documentElement.style.setProperty("--soft-background", "#333333");
	document.documentElement.style.setProperty("--text", "#FBFBFB");
} else {
	document.documentElement.style.setProperty("--background", "#EBEBEB");
	document.documentElement.style.setProperty("--hard-background", "#EEEEEE");
	document.documentElement.style.setProperty("--soft-background", "#CCCCCC");
	document.documentElement.style.setProperty("--text", "#1B1B1B");
}