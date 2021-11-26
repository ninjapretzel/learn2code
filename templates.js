class Template {
	draw(data) {
		return <div>Sample text <span>Sample replaceholder...{data["something"]}</span></div>
	}
}

/** @type { Map<string, Template> } Templates. Pseudo-modules are expected to assign into this, rather than exporting. */
const TEMPLATES = {};