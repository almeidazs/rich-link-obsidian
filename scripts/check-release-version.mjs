import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const manifestJson = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const versionsJson = JSON.parse(fs.readFileSync("versions.json", "utf8"));

const expectedVersion = process.argv[2] ?? process.env.RELEASE_VERSION ?? null;
const packageVersion = packageJson.version;
const manifestVersion = manifestJson.version;
const minAppVersion = manifestJson.minAppVersion;
const mappedMinAppVersion = versionsJson[manifestVersion];

if (packageVersion !== manifestVersion) {
	console.error(
		`package.json version (${packageVersion}) does not match manifest.json version (${manifestVersion}).`,
	);
	process.exit(1);
}

if (mappedMinAppVersion !== minAppVersion) {
	console.error(
		`versions.json entry for ${manifestVersion} (${mappedMinAppVersion ?? "missing"}) does not match manifest minAppVersion (${minAppVersion}).`,
	);
	process.exit(1);
}

if (expectedVersion && expectedVersion !== manifestVersion) {
	console.error(
		`Requested release version (${expectedVersion}) does not match manifest.json version (${manifestVersion}).`,
	);
	process.exit(1);
}

console.log(`Release version check passed for ${manifestVersion}`);
