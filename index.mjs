#!/usr/bin/env node

import yargs from "yargs";
import chalk from "chalk";
import ffmpeg from 'fluent-ffmpeg';
import wrap from 'word-wrap';
import * as tmp from 'tmp';
import * as fs from 'fs';


const options = yargs(process.argv)
	//.usage("Usage: -f <source file>")
	.option("f", { alias: "source", description: "The initial gif that should have text added to it", required: true})
	.option("t", { alias: "text", description: "The text to put on the gif", required: true })
	.option("o", { alias: "output", description: "Path to output file", required: true })
	//.options("y", { alias: "height", description: "Height of the added text box" })
	.parse();

if (!options.source) throw new Error("Must provide a source file");
if (!options.output) throw new Error("Must provide a destination file");

const size = parseInt(options.y || 200);

const command = ffmpeg()
	.input(options.f)
	.videoFilter(`pad=iw:ih+${size}:0:${size}:white`);

const sep = '<ENDL>';
const rows = wrap(options.t || "", {width: 20, indent:'', trim: true, newline: sep, escape: (s) => s.replace(/[\n*]/g,'').replaceAll(/(['"%])/g, "$1")}).split(sep);
const tmpFiles = [];

for (let i = 0; i < rows.length; i++) {
	const file = tmp.fileSync();
	fs.writeFileSync(file.name, rows[i]);
	tmpFiles.push(file);
	command.videoFilter(`
		drawtext=
			textfile=${file.name}: 
			fontsize=50: 
			x=(w-text_w)/2: 
			y=(${size})/2+(${(i - (rows.length)/2).toString()}*(text_h+5)):`);
}

console.log('Running');
command.output(options.output);
command.on('end', async () => {
	console.log('Done.');
});
command.run();

