import { Utility } from './Utility';
import { remote } from 'electron';
import * as mkdirp from 'mkdirp';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';

//Wrap the needed filesystem-related functions in a promise-based interface
require('util.promisify/shim')();
import { promisify } from 'util';
const readFile = promisify(fs.readFile);
const globFiles = promisify(glob);
const makeDirs = promisify(mkdirp);

export class ClassificationLabelManager
{
	public static labelsDirectory() {
		return path.join(remote.app.getPath('userData'), 'labels');
	}
	
	public static async loadSupportedLabels()
	{
		try
		{
			//Attempt to create the labels directory if it doesn't already exist
			let labelsDir = ClassificationLabelManager.labelsDirectory();
			if (fs.existsSync(labelsDir) === false) {
				await makeDirs(labelsDir);
			}
			
			//Create a map to hold the list of labels for each labels file
			let supportedLabels = new Map<string,string[]>();
			
			//Retrieve the list of labels files
			let labelFiles = await globFiles(path.join(labelsDir, '*.txt'));
			for (let file of labelFiles)
			{
				//Extract the list of labels from the file and add them to our mappings
				let key = Utility.removeExtension(path.basename(file));
				let lines = (await readFile(file, {'encoding': 'utf-8'})).replace(/\r\n/g, '\n').split('\n');
				lines = lines.filter((line : string) => { return (line.replace(/\s/g, '').length > 0); });
				if (lines.length > 1) {
					supportedLabels.set(key, lines);
				}
			}
			
			return supportedLabels;
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
}
