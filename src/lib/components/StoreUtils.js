import { browser } from "$app/environment";
import { toast } from "@zerodevx/svelte-toast";


export const showAlert = (message) => { toast.push(message, {classes: ['']}) };
export const showWarning = (message) => { toast.push(message, {classes: ['warning']}) };
export const showError = (message) => { toast.push(message, {classes: ['error']}) };

/**
 * Get the expiry time.
 * @returns {number} The expiry time.
 */
export function getExpiryTime() {
	return new Date(new Date().getTime() + 60 * 1000).getTime();
}

/**
 * Get the value from the session storage.
 * @param {string} key - The key to retrieve the value.
 * @returns {*} The value from the session storage.
 */
export function getSessionValue(key) {
	if (browser && sessionStorage) {
		const value = JSON.parse(sessionStorage.getItem(key) ?? '{}');
		return value;
	}
	return null;
}

/**
 * Set the value in the session storage.
 * @param {string} key - The key to store the value.
 * @param {*} data - The data to be stored.
 */
export function setSessionValue(key, data) {
	if ( browser && data !== undefined && sessionStorage) {
		console.debug('updating session', key, data);
		sessionStorage.setItem(key, JSON.stringify(data));
	}
}

/**
 * Get the value from the local storage.
 * @param {string} key - The key to retrieve the value.
 * @returns {*} The value from the local storage.
 */
export function getLocalValue(key) {
	if (browser && localStorage) {
		const value = JSON.parse(localStorage.getItem(key) ?? '{}');
		if (value && value.expires != null && value.expires <= new Date().getTime()) {
			console.warn('Expired data...', key);

			localStorage.removeItem(key);
			return null;
		}
		console.debug('found data in cache', key);

		return value ? value.data : null;
	}
	return null;
}

/**
 * Set the value in the local storage.
 * @param {string} key - The key to store the value.
 * @param {*} data - The data to be stored.
 * @param {number|null} expires - The expiration time of the data.
 */
export function setLocalValue(key, data, expires = null) {
	if (data !== undefined && browser && localStorage) {
		
		if(!expires) expires = new Date().getTime() + (30 * 24 * 60 * 1000);

		if (expires) localStorage.setItem(key, JSON.stringify({ expires, data }));
		else localStorage.setItem(key, JSON.stringify({data}));
	}
}

/**
 * Filter and sort items based on the provided text.
 * @param {Array<any>} items - The array of items to be filtered and sorted.
 * @param {string} text - The text to filter the items.
 * @returns {Array<any>} The filtered and sorted items.
 */
export const filterAndSort = (items, text) => {
	return sortByName(items.filter((c) => c.name?.toLowerCase().indexOf(text?.toLowerCase()) > -1));
};

/**
 * Sort the items by name.
 * @param {Array<any>} items - The array of items to be sorted.
 * @returns {Array<any>} The sorted items.
 */
const sortByName = (items) => {
	return items.sort((a, b) => {
		if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
		else return -1;
	});
};
