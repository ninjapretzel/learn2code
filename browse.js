import { Lesson } from "./src/lesson.js";
import { manifest, languages } from "./data/manifest.js";
import { render, show } from "./common.js";
import { showLesson } from "./execute.js";

export const AllLessons = {};
export const Categories = {};
export const BrowseLoader = loadAllLessons();
export const Loaded = await BrowseLoader;

export async function showBrowse() {
	await BrowseLoader;
	render("#browse", "Browse", {AllLessons, Categories});
	show("browse");
	
	$("#browse").click(()=>{
		// showLesson();
	});
}

async function loadAllLessons() {

	let total = 0;
	
	const prev = {}
	const ord = {}
	
	for (let lang of languages) { AllLessons[lang] = {}; ord[lang] = 0; }
	
	for (let item of manifest) {
		for (let lang of languages) {
			try {
				let result = await import(`./data/${lang}/${item}.js`);
				result = AllLessons[lang][item] = result.default ?? result;
				if (!result) { continue; }
				if (prev[lang]) { prev[lang].next = result; }
				result.prev = prev[lang];
				result.ord = ord[lang];
				result.id = result.Content.Category+"."+result.Content.Lesson;
				result.lang = lang;
				//console.log(`Setting id=${result.id} lang=${result.lang}`);
				
				// lazy initialization
				if (!Categories[result.Content.Category]) {
					Categories[result.Content.Category] = {};
				}
				if (!Categories[result.Content.Category][lang]) {
					Categories[result.Content.Category][lang] = [];
				}
				Categories[result.Content.Category][lang].push(result);
				
				total++;
				ord[lang]++;
				prev[lang] = result;
			} catch (err) {
				console.warn(`failed to import resource ${lang}/${item}.js`, err);
			}
		}
	}
	console.log("loaded",total,"lessons");
	console.log("all lessons = ", AllLessons);
	console.log("categories = ", Categories);
	return true;
}