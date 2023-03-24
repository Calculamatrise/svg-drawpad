import Canvas from "./utils/Canvas.js";

window.canvas = new Canvas(document.querySelector('#view'));

container.addEventListener('contextmenu', function (event) {
	event.preventDefault();
});

document.documentElement.addEventListener('pointerdown', function (event) {
	this.style.setProperty('--offsetX', event.offsetX);
	this.style.setProperty('--offsetY', event.offsetY);
});

if (!window.hasOwnProperty('api')) {
	window.api = window.api || {};
	window.api.receive = window.api.receive || (() => { });
	window.api.send = window.api.send || (() => { });
}

window.api.receive('openFile', function () {
	window.showOpenFilePicker({
		excludeAcceptAllOption: true,
		multiple: false,
		types: [{
			description: 'Images',
			accept: {
				'image/svg+xml': []
			}
		}]
	}).then(([fileHandle]) => fileHandle.getFile()).then(async file => {
		window.canvas.import(await file.text())
	});
});

window.api.receive('saveProjectAs', function () {
	let date = new Date();
	date = new Date(date.setHours(date.getHours() - date.getTimezoneOffset() / 60)).toISOString().split(/t/i);
	let link = document.createElement('a');
	link.href = window.URL.createObjectURL(new Blob([window.canvas.toString()], { type: 'image/svg+xml' }));
	link.download = 'svg_canvas-' + date[0] + '_' + date[1].replace(/\..+/, '').replace(/:/g, '-');
	link.dispatchEvent(new MouseEvent('click'));
	console.log(date, link)
});

const minimize = document.querySelector("window-frame button#minimize");
if (minimize !== null) {
	minimize.addEventListener('click', function () {
		window.api.send('minimizeWindow');
	});
}

const maximize = document.querySelector("window-frame button#maximize");
if (maximize !== null) {
	maximize.addEventListener('click', function () {
		window.api.send('maximizeWindow');
	});

	window.api.receive('isMaximized', function (isMaximized) {
		if (maximize === null) return;
		maximize.title = isMaximized ? 'Restore' : 'Maximize';
	});
}

const close = document.querySelector("window-frame button#close");
if (close !== null) {
	close.addEventListener('click', function () {
		window.api.send('closeWindow');
	});
}

const label = document.querySelector("window-frame label");
if (label !== null) {
	label.addEventListener('click', function () {
		let rect = label.getBoundingClientRect();
		window.api.send('displayAppMenu', {
			x: rect.x,
			y: rect.bottom
		})
	});
}