import Canvas from "./utils/Canvas.js";

window.canvas = new Canvas(document.querySelector('#view'));

let colors = document.querySelector('#container section.bottom.left');
let toolbar = document.querySelector('details[name="toolbar"]');
window.canvas.addEventListener('toolSelected', (name, tool) => {
	container.style.setProperty('cursor', name === 'camera' ? 'move' : 'default');
	colors !== null && colors.style[(/^(brush|c(urv|ircl)e|ellipse|heart|line|rectangle)$/i.test(name) ? 'remove' : 'set') + 'Property']('display', 'none');
	// add setting option to automatically close toolbar
	// toolbar.removeAttribute('open');
});

let contextmenu = document.querySelector('context-menu');
contextmenu !== null && (contextmenu.remove(),
contextmenu.style.removeProperty('display'));
container.addEventListener('contextmenu', event => {
	event.preventDefault();
	contextmenu !== null && (contextmenu.style.setProperty('left', event.clientX + 'px'),
	contextmenu.style.setProperty('top', event.clientY + 'px'),
	document.body.appendChild(contextmenu));
});

document.documentElement.addEventListener('pointerdown', function (event) {
	this.style.setProperty('--offsetX', event.offsetX);
	this.style.setProperty('--offsetY', event.offsetY);
	contextmenu !== null && contextmenu.remove();
});

let themeselect = document.querySelector('#theme-select');
if (themeselect !== null) {
	themeselect.value = window.canvas.config.theme;
	themeselect.addEventListener('change', event => {
		window.canvas.config.theme = event.target.value;
	});
}

let changes = document.querySelector('#changes');
if (changes !== null) {
	let tag = null; // '2023-11-25';
	let dismissed = window.canvas.config.dismissedNotices.includes(tag);
	if (tag && !dismissed) {
		window.canvas.config.dismissedNotices.splice(0);
		let dismiss = changes.querySelector('button');
		dismiss.addEventListener('click', () => {
			window.canvas.config.dismissedNotices.push(tag);
			changes.remove();
		});

		changes.style.removeProperty('display');
	} else {
		changes.remove();
	}
}