import { Utility } from './Utility';
import * as mkdirp from 'mkdirp';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';

//Wrap the needed filesystem-related functions in a promise-based interface
require('util.promisify/shim')();
import { promisify } from 'util';
const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const globFiles = promisify(glob);
const makeDirs = promisify(mkdirp);

//Represents a single classification choice made by the user
class ClassificationChoice
{
	public constructor(sourceFile : string, destFile : string, label : string)
	{
		this.sourceFile = sourceFile;
		this.destFile = destFile;
		this.label = label;
	}
	
	public sourceFile : string;
	public destFile : string;
	public label : string;
}

//Manages the functionality for allowing the user to manually classify images
export class ClassificationManager
{
	//Our list of classification labels
	private labels : string[];
	
	//Our input directory
	private inputDir : string;
	
	//Our output directory
	private outputDir : string;
	
	//The list of input files found in the input directory
	private inputFiles : string[] = [];
	
	//The list of classification choices that the user has made so far
	private classifications : ClassificationChoice[] = []
	
	protected constructor(labels : string[], inputDir : string, outputDir : string)
	{
		this.labels = labels;
		this.inputDir = inputDir;
		this.outputDir = outputDir;
	}
	
	protected subdirectoryForLabel(label : string) {
		return path.join(this.outputDir, label.replace(/[^A-Za-z0-9]/g, ''));
	}
	
	protected async createLabelDirs()
	{
		try
		{
			//Attempt to create the output subdirectory for each of our labels
			for (let label of this.labels) {
				await makeDirs(this.subdirectoryForLabel(label));
			}
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
	
	protected async scanInputFiles()
	{
		try
		{
			//Scan for image files (in any of the common raster formats supported by Electron) in our input directory
			this.inputFiles = [];
			for (let extension of ['gif', 'jpg', 'jpeg', 'png']) {
				this.inputFiles = this.inputFiles.concat(await globFiles(path.join(this.inputDir, `*.${extension}`)));
			}
			
			//We need to have at least one input file
			if (this.inputFiles.length == 0) {
				throw new Error('No image files could be found in the input directory.');
			}
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
	
	public static async create(labels : string[], inputDir : string, outputDir : string)
	{
		try
		{
			//Attempt to create the instance and all of the required output directories, and scan for input files
			let instance = new ClassificationManager(labels, inputDir, outputDir);
			await instance.createLabelDirs();
			await instance.scanInputFiles();
			return instance;
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
	
	//Retrieves the list of classification labels
	public getLabels() {
		return this.labels.slice(0);
	}
	
	//Retrieves the list of input files
	public getInputFiles() {
		return this.inputFiles.slice(0);
	}
	
	//Retrieves the last classification choice (if any)
	public getLastClassification() {
		return ((this.classifications.length > 0) ? this.classifications[this.classifications.length-1] : null);
	}
	
	//Determines if we have any more images that require classification
	public imagesRemaining() {
		return (this.getCurrentImageIndex() < this.inputFiles.length);
	}
	
	//Retrieves the index of the current image that requires classification
	public getCurrentImageIndex() {
		return this.classifications.length;
	}
	
	//Retrieves the path of the current image that requires classification
	public getCurrentImagePath() {
		return this.inputFiles[this.getCurrentImageIndex()];
	}
	
	//Ignores the current image
	public async ignoreCurrentImage()
	{
		//Verify that we actually have a current image to ignore
		if (this.imagesRemaining() === false) {
			throw new Error('No images remaining to classify.');
		}
		
		//Add the empty classification to our list
		this.classifications.push(new ClassificationChoice(this.getCurrentImagePath(), '', ''));
	}
	
	//Classifies the current image as the specified label
	public async classifyCurrentImage(label : string)
	{
		try
		{
			//Verify that we actually have a current image to classify
			if (this.imagesRemaining() === false) {
				throw new Error('No images remaining to classify.');
			}
			
			//Verify that the specified classification label is valid
			if (this.labels.indexOf(label) == -1) {
				throw new Error(`Unrecognised classification label "${label}".`);
			}
			
			//Generate the destination path to copy the image to, ensuring the filename does not already exist
			let sourceFile = this.getCurrentImagePath();
			let extension = path.extname(sourceFile);
			let pathBase = Utility.removeExtension(path.join(this.subdirectoryForLabel(label), path.basename(sourceFile)));
			let destFile = pathBase + extension;
			while (fs.existsSync(destFile) === true) {
				destFile = `${pathBase}_${Date.now().toString()}${extension}`;
			}
			
			//Attempt to copy the source file to the destination file
			await copyFile(sourceFile, destFile);
			
			//Add the classification choice to our list
			let classification = new ClassificationChoice(sourceFile, destFile, label);
			this.classifications.push(classification);
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
	
	//Reverts the last classification choice
	public async undoLastClassification()
	{
		try
		{
			//Verify that we actually have a classification choice to revert
			if (this.classifications.length == 0) {
				throw new Error('No existing classification choices available to undo.');
			}
			
			//Remove the previous classification from our list and remove the destination file (if any)
			let lastClassification = <ClassificationChoice>(this.classifications.pop());
			if (lastClassification.destFile.length > 0) {
				await unlink(lastClassification.destFile);
			}
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
}
