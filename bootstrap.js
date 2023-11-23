import Canvas from "./utils/Canvas.js";

window.canvas = new Canvas(document.querySelector('#view'));

container.addEventListener('contextmenu', function (event) {
	event.preventDefault();
});

document.documentElement.addEventListener('pointerdown', function (event) {
	this.style.setProperty('--offsetX', event.offsetX);
	this.style.setProperty('--offsetY', event.offsetY);
});