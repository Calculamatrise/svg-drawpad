import Canvas from "./utils/Canvas.js";
import Device from "./utils/Device.js";

let mobilePath = /mobile\/?/gi.test(location.pathname);
if (Device.isMobile() && !mobilePath) {
    location.assign(location.href + 'mobile');
} else if (!Device.isMobile() && mobilePath) {
    location.assign(location.href.replace(/mobile\/?/gi, ''));
}

window.canvas = new Canvas(document.querySelector('#view'));

container.addEventListener('contextmenu', function(event) {
	event.preventDefault();
});

document.addEventListener('mousedown', function(event) {
    this.documentElement.style.setProperty('--offsetX', event.offsetX);
    this.documentElement.style.setProperty('--offsetY', event.offsetY);
});

window.setTheme = function(theme) {
    if (theme === 'dark') {
        document.documentElement.style.setProperty("--background", '#1b1b1b');
        document.documentElement.style.setProperty("--hard-background", '#111');
        document.documentElement.style.setProperty("--soft-background", '#333');
        document.documentElement.style.setProperty("--text", '#fbfbfb');
    } else {
        document.documentElement.style.setProperty("--background", '#ebebeb');
        document.documentElement.style.setProperty("--hard-background", '#eee');
        document.documentElement.style.setProperty("--soft-background", '#ccc');
        document.documentElement.style.setProperty("--text", '#1b1b1b');
    }
}

setTheme(window.canvas.config.theme);