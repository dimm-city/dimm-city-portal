const iconElement = (/** @type {string} */ data) => {
	const icon = document.createElement('div');
	icon.innerHTML = data;
	return icon;
};


export const PlayerIcon = iconElement('<i class="bi bi-person-circle"></i>');

export const GearIcon = iconElement(`<i class="bi bi-gear-wide-connected"></i>`);

export const PeopleIcon = iconElement(`<i class="bi bi-people"></i>`);

export const ShareIcon = iconElement(`<i class="bi bi-send-plus"></i>`);

export const SaveIcon = iconElement(`<i class="bi bi-floppy"></i>`);

export const LeaveIcon = iconElement(`<i class="bi bi-escape"></i>`);
