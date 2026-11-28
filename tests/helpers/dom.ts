import { DOMParser } from "linkedom";

// Obsidian runs in a browser engine that provides DOMParser; Node does not.
// Importing this file installs linkedom's implementation for the tests.
(globalThis as { DOMParser?: unknown }).DOMParser = DOMParser;
