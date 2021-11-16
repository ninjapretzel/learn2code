export function urlParam() {
	const result = {};
	const items =  location.search.substr(1).split("&");
	for (let i = 0; i < items.length; i++) {
		const split = items[i].split("=");
		result[split[0].toLowerCase()] = decodeURIComponent(split[1]).toLowerCase();
	}
	return result;
}