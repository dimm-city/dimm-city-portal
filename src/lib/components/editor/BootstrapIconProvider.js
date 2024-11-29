import { IconProvider } from 'js-draw';

//Requires this file to be placed in the assets folder
//https://github.com/twbs/icons/blob/main/bootstrap-icons.svg
const svgNamespace = 'http://www.w3.org/2000/svg';
const iconString = `<svg class="bi" width="[size]" height="[size]" fill="currentColor">
              <use xlink:href="/assets/bootstrap-icons.svg#[icon-key]"></use>
            </svg>`;

const makeIcon = (/** @type {string} */ key, size = '100%') => {
	const icon = document.createElementNS(svgNamespace, 'svg');
	icon.innerHTML = iconString.replace('[icon-key]', key).replaceAll('[size]', size);
	icon.setAttribute('viewBox', '0 0 100 100');
	icon.style.color = 'var(--icon-color)';
	return icon;
};
/**
 * @param {{ r: number; g: number; b: number; a: number; }} color
 */
function rgbaToJson(color) {
	// Extract values from the JSON object
	const r = Math.floor(color.r * 255);
	const g = Math.floor(color.g * 255);
	const b = Math.floor(color.b * 255);
	const a = Math.floor(color.a * 255);

	// Convert each component to a two-digit hex string
	const rHex = r.toString(16).padStart(2, '0').toUpperCase();
	const gHex = g.toString(16).padStart(2, '0').toUpperCase();
	const bHex = b.toString(16).padStart(2, '0').toUpperCase();
	const aHex = a.toString(16).padStart(2, '0').toUpperCase();

	// Combine into the full hex string
	return `#${rHex}${gHex}${bHex}${aHex}`;
}
export class BootstrapIconProvider extends IconProvider {
	makeDropdownIcon() {
		const dropdown = makeIcon('chevron-compact-up', '100%');
		dropdown.style.color = 'var(--fourth-accent)';
		return dropdown;
	}

	/**
	 * @param {any} penStyle
	 */
	makePenIcon(penStyle) {
		const pen = makeIcon('pen', '100%');

		let color = penStyle?.color.hexString;
		if (!color && penStyle.color) {
			// @ts-ignore
			color = rgbaToJson(penStyle?.color);
		}
		pen.style.color = color ?? 'var(--icon-color)';
		//console.log('penStyle', penStyle, pen);
		return pen;
	}
	makeEraserIcon(size, mode) {
		let icon = makeIcon('eraser');
		return icon;
	}

	makeSelectionIcon() {
		return makeIcon('bounding-box-circles');
	}

	makeRotateIcon() {
		const icon = makeIcon('rotate-left');
		return icon;
	}

	makeHandToolIcon() {
		return makeIcon('dpad');
	}
	makeTouchPanningIcon() {
		return makeIcon('zoom-in');
	}
	makeZoomIcon() {
		return makeIcon('zoom-in');
	}
	makeRotationLockIcon() {
		const icon = makeIcon('lock');
		return icon;
	}
	makeInsertImageIcon() {
		const icon = makeIcon('image');
		return icon;
	}
	makeUploadFileIcon() {
		const icon = makeIcon('file-up');
		return icon;
	}

	makeTextIcon(textStyle) {
		const icon = makeIcon('textarea-t', '100%');

		let color = textStyle?.renderingStyle.fill.hexString;
		if (!color && textStyle.renderingStyle.fill) {
			// @ts-ignore
			color = rgbaToJson(textStyle?.renderingStyle.fill);
		}
		icon.style.color = color ?? 'var(--icon-color)';
		return icon;
	}
	makePipetteIcon(color) {
		const icon = makeIcon('eyedropper');
		if (color) {
			icon.style.color = `#${color}`;
		}
		return icon;
	}
	makeShapeAutocorrectIcon() {
		const icon = makeIcon('arrows-vertical');
		return icon;
	}
	makeStrokeSmoothingIcon() {
		const icon = makeIcon('graph-up-arrow');
		return icon;
	}

	makeDuplicateSelectionIcon() {
		const icon = makeIcon('files-alt');
		return icon;
	}
	makeCopyIcon() {
		return makeIcon('files');
	}

	makePasteIcon() {
		return makeIcon('file-earmark-arrow-down');
	}

	makeDeleteSelectionIcon() {
		return makeIcon('trash-fill');
	}

	makeCloseIcon() {
		const icon = makeIcon('x-lg');
		return icon;
	}

	makeSaveIcon() {
		return makeIcon('save-fill');
	}

	makeConfigureDocumentIcon() {
		const icon = makeIcon('sliders2');
		return icon;
	}

	makeOverflowIcon() {
		const icon = makeIcon('three-dots-vertical');
		return icon;
	}

	makeHelpIcon() {
		const icon = makeIcon('question-circle-fill');
		return icon;
	}
	
	makeIconFromPath(pathData, fill, strokeColor, strokeWidth) {
		const svg = document.createElementNS(svgNamespace, 'svg');
		svg.setAttribute('viewBox', '0 0 100 100');
		if (fill) {
			svg.style.fill = fill;
		}
		if (strokeColor) {
			svg.style.stroke = strokeColor;
		}
		if (strokeWidth) {
			svg.style.strokeWidth = strokeWidth;
		}
		
		const path = document.createElementNS(svgNamespace, 'path');
		path.setAttribute('d', pathData);
		svg.appendChild(path);
		return svg;
	}

	makeCheckerboardPattern() {
		const patternDef = `<pattern id="checkerboard" width="4" height="4" patternUnits="userSpaceOnUse">
			<rect x="0" y="0" width="2" height="2" fill="#eee" />
			<rect x="2" y="2" width="2" height="2" fill="#eee" />
		</pattern>`;
		const patternRef = 'url(#checkerboard)';
		return { patternDef, patternRef };
	}

	isRoundedTipPen(penStyle) {
		return false;
	}

	isPolylinePen(penStyle) {
		return false;
	}

	licenseInfo() {
		return null;
	}
}