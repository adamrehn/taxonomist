import { ClassificationManager } from '../../core/ClassificationManager';
import { SelectParametersState } from './SelectParametersState';
import { TransitionProvider } from '../TransitionProvider';
import { DialogProvider } from '../DialogProvider';
import { UIState } from '../UIState';
import * as path from 'path';
import * as $ from 'jquery';

export class ClassifyImagesState extends UIState
{
	//Our classification manager
	private manager! : ClassificationManager;
	
	//The <img> tag displaying the current image
	private imageDisplay! : JQuery<HTMLElement>;
	
	//The text displaying our current progress
	private imageProgress! : JQuery<HTMLElement>;
	
	//The <div> containing our action buttons
	private buttonWrapper! : JQuery<HTMLElement>;
	
	//Our "undo" floating panel with text and button
	private undoOuter! : JQuery<HTMLElement>;
	private undoInner! : JQuery<HTMLElement>;
	private undoText! : JQuery<HTMLElement>;
	private undoButton! : JQuery<HTMLElement>;
	
	public static identifier() {
		return 'classify-images';
	}
	
	public getTitle() {
		return 'Classify Images';
	}
	
	public constructor(transition : TransitionProvider, dialogs : DialogProvider) {
		super(ClassifyImagesState.identifier(), transition, dialogs);
	}
	
	public onShow(...args: any[]) : void
	{
		//Configure our classification manager with the supplied parameters
		let labels = <string[]>(args[0]['labels']);
		let inputDir = <string>(args[0]['inputDir']);
		let outputDir = <string>(args[0]['outputDir']);
		ClassificationManager.create(labels, inputDir, outputDir)
		.then((manager : ClassificationManager) =>
		{
			//Store the manager and populate our UI elements
			this.manager = manager;
			this.populateRoot();
			super.onShow();
		})
		.catch((err : Error) =>
		{
			//If an error occurs, return to the previous state
			this.dialogs.handleError(err);
			this.transition.setState(SelectParametersState.identifier());
		});
	}
	
	public onResize() : void {
		this.updateDisplay();
	}
	
	private showUndoBar() {
		this.undoInner.css('opacity', '1');
	}
	
	private hideUndoBar() {
		this.undoInner.css('opacity', '0');
	}
	
	private enableUndoButton() {
		this.undoButton.removeAttr('disabled');
	}
	
	private disableUndoButton() {
		this.undoButton.attr('disabled', 'disabled');
	}
	
	private enableClassificationButtons() {
		$('#button-wrapper button', this.root).removeAttr('disabled');
	}
	
	private disableClassificationButtons() {
		$('#button-wrapper button', this.root).attr('disabled', 'disabled');
	}
	
	private updateDisplay()
	{
		//Automatically layout the buttons in columns of 10
		let numColumns = Math.ceil(this.manager.getLabels().length / 10);
		if (numColumns > 1) {
			this.buttonWrapper.css('grid-template-columns', `repeat(${numColumns}, max-content)`);
		}
		else {
			this.buttonWrapper.css('grid-template-columns', '100%');
		}
		
		//Determine if there is a current image to display
		if (this.manager.imagesRemaining() === true)
		{
			//Update our progress text
			this.imageProgress.html(`Image&nbsp;${this.manager.getCurrentImageIndex()+1}&nbsp;of&nbsp;${this.manager.getInputFiles().length}:`);
			
			//Determine the maximum height that the image cannot exceed
			let maxHeight = <number>($('body').innerHeight()) - <number>(this.undoOuter.innerHeight());
			
			//Display the current image
			this.imageDisplay.attr('src', this.manager.getCurrentImagePath());
			this.imageDisplay.css('max-height', `${Math.floor(maxHeight)}px`);
			
			//Enable the classification buttons
			this.enableClassificationButtons();
		}
		else
		{
			//Update our progress text
			this.imageProgress.text('All images classified.');
			
			//Don't display an image
			this.imageDisplay.attr('src', '');
			
			//Disable the classification buttons
			this.disableClassificationButtons();
		}
		
		//Determine if there is a previous action to display the undo option for
		let lastAction = this.manager.getLastClassification();
		if (lastAction !== null)
		{
			//Set the action description text
			if (lastAction.destFile.length > 0) {
				this.undoText.text(`Classified the image "${path.basename(lastAction.sourceFile)}" as "${lastAction.label}".`);
			}
			else {
				this.undoText.text(`Ignored the image "${path.basename(lastAction.sourceFile)}".`);
			}
			
			//Show the undo bar
			this.enableUndoButton();
			this.showUndoBar();
		}
		else
		{
			//Hide the undo bar
			this.disableUndoButton();
			this.hideUndoBar();
		}
	}
	
	private populateRoot()
	{
		//Clear any previously-created UI elements
		this.root.empty();
		
		//Create a wrapper for our left-hand column
		let leftColumn = $(document.createElement('div')).attr('id', 'left-column-wrapper');
		this.root.append(leftColumn);
		
		//Create our view for displaying the current image
		let imageWrapper = $(document.createElement('div')).attr('id', 'image-wrapper');
		this.imageDisplay = $(document.createElement('img')).attr('id', 'current-image');
		imageWrapper.append(this.imageDisplay);
		leftColumn.append(imageWrapper);
		
		//Create our "undo" bar
		this.undoOuter = $(document.createElement('div')).attr('id', 'undo-wrapper');
		this.undoInner = $(document.createElement('div')).attr('id', 'undo-inner');
		this.undoText = $(document.createElement('span')).attr('id', 'undo-text');
		this.undoButton = $(document.createElement('button')).text('Undo');
		this.undoInner.append(this.undoText, this.undoButton);
		this.undoOuter.append(this.undoInner);
		leftColumn.append(this.undoOuter);
		this.hideUndoBar();
		
		//Wire up the event handler for the undo button
		this.undoButton.click(() =>
		{
			//Disable the undo button until the request has been processed
			this.disableUndoButton();
			
			//Undo the last action
			this.manager.undoLastClassification().then(() => {
				this.updateDisplay();
			})
			.catch((err : Error) =>
			{
				this.dialogs.handleError(err);
				this.updateDisplay();
			});
		});
		
		//Create the button panel and the text to display the image progress
		let rightColumn = $(document.createElement('div')).attr('id', 'right-column-wrapper');
		this.buttonWrapper = $(document.createElement('div')).attr('id', 'button-wrapper');
		this.imageProgress = $(document.createElement('p')).attr('id', 'image-progress');
		rightColumn.append(this.imageProgress, this.buttonWrapper);
		this.root.append(rightColumn);
		
		//Create a button to ignore the current image
		let ignoreButton = $(document.createElement('button')).html('Ignore&nbsp;Current&nbsp;Image');
		ignoreButton.insertBefore(this.buttonWrapper);
		ignoreButton.click(() =>
		{
			//Disable the classification buttons until the request has been processed
			this.disableClassificationButtons();
			
			//Ignore the current image
			this.manager.ignoreCurrentImage().then(() => {
				this.updateDisplay();
			})
			.catch((err : Error) =>
			{
				this.dialogs.handleError(err);
				this.updateDisplay();
			});
		});
		
		//Create our list of classification buttons
		for (let label of this.manager.getLabels())
		{
			let button = $(document.createElement('button')).text(label);
			this.buttonWrapper.append(button);
			button.click(() =>
			{
				//Disable the classification buttons until the request has been processed
				this.disableClassificationButtons();
				
				//Classify the current image
				this.manager.classifyCurrentImage(label).then(() => {
					this.updateDisplay();
				})
				.catch((err : Error) =>
				{
					this.dialogs.handleError(err);
					this.updateDisplay();
				});
			});
		}
		
		//Update our image display to show the initial image
		this.updateDisplay();
	}
}
