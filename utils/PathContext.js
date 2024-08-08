export default class {
	parts = [];
	arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, dx, dy) {
		this.parts.push('A' + rx + ' ' + ry + ' ' + xAxisRotation + ' ' + largeArcFlag + ' ' + sweepFlag + ' ' + dx + ' ' + dy)
	}
	bezierCurveTo(c1x, c1y, c2x, c2y, dx, dy) {
		this.parts.push('C' + c1x + ' ' + c1y + ',' + c2x + ' ' + c2y + ',' + dx + ' ' + dy)
	}
	closePath() {
		this.parts.push('Z')
	}
	moveTo(x, y) {
		this.parts.push('M' + x + ' ' + y)
	}
	lineTo(x, y) {
		this.parts.push('L' + x + ' ' + y)
	}
	quadraticCurveTo(cx, cy, dx, dy) {
		this.parts.push('C' + cx + ' ' + cy + ',' + dx + ' ' + dy)
	}
	toString() {
		return this.parts.join('')
	}
}