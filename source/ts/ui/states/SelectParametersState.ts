import { ClassificationLabelManager } from '../../core/ClassificationLabelManager';
import { ClassifyImagesState } from './ClassifyImagesState';
import { LoadingLabelsState } from './LoadingLabelsState';
import { TransitionProvider } from '../TransitionProvider';
import { DialogProvider } from '../DialogProvider';
import { UIState } from '../UIState';
import { remote } from 'electron';
import * as $ from 'jquery';

export class SelectParametersState extends UIState
{
	private supportedLabels! : Map<string,string[]>;
	private labelsDropdown! : JQuery<HTMLElement>;
	private startButton! : JQuery<HTMLElement>;
	private inputDirID = 'input-directory';
	private outputDirID = 'output-directory';
	
	public static identifier() {
		return 'select-parameters';
	}
	
	public getTitle() {
		return 'Select Parameters';
	}
	
	public constructor(transition : TransitionProvider, dialogs : DialogProvider) {
		super(SelectParametersState.identifier(), transition, dialogs);
	}
	
	public onShow(...args: any[]) : void
	{
		//If this is the first time this state is shown, load the labels list and populate our UI
		if (args.length > 0 && args[0]['supportedLabels'] !== undefined)
		{
			this.supportedLabels = args[0]['supportedLabels'];
			this.populateRoot();
		}
		
		this.validateForm();
		super.onShow();
	}
	
	private getSelectedLabels()
	{
		let labelsKey = <string>(this.labelsDropdown.val());
		return this.supportedLabels.get(labelsKey);
	}
	
	private getSelectedDirectory(id : string)
	{
		let dir = <string>($(`#${id}`).val());
		return (dir === undefined) ? '' : dir;
	}
	
	private validateForm()
	{
		//We require both an input directory and an output directory
		let inputDir = this.getSelectedDirectory(this.inputDirID);
		let outputDir = this.getSelectedDirectory(this.outputDirID);
		if (inputDir.length > 0 && outputDir.length > 0)
		{
			//Enable the "Start Classification" button
			this.startButton.removeAttr('disabled');
		}
		else
		{
			//Disable the "Start Classification" button
			this.startButton.attr('disabled', 'disabled');
		}
	}
	
	private createDirChooser(fieldID : string, fieldLabel : string)
	{
		//Create a wrapper paragraph to hold the chooser
		let wrapper = $(document.createElement('p'));
		let label = $(document.createElement('strong')).text(fieldLabel);
		wrapper.append(label);
		
		//Create the chooser
		let field = $(document.createElement('input')).attr('type', 'hidden').attr('id', fieldID);
		let display = $(document.createElement('span')).text('No directory selected.');
		let button = $(document.createElement('button')).text('Choose');
		wrapper.append(field, display, button);
		
		//Wire up the event handler for the button
		button.click(() =>
		{
			this.dialogs.showOpenDialog('Choose directory', [], true).then((paths : string[]) =>
			{
				//Verify that the user specified a directory path
				if (paths !== undefined && paths.length == 1)
				{
					//Update the hidden form field and the display text
					field.val(paths[0]);
					display.text(paths[0]);
					
					//Perform form validation
					this.validateForm();
				}
			})
			.catch((err : Error) => {
				this.dialogs.handleError(err);
			});
		});
		
		return wrapper;
	}
	
	private populateRoot()
	{
		//Clear any previous UI elements
		this.root.empty();
		
		//Create our heading
		let heading = $(document.createElement('h1')).text('Select classification labels and data directories');
		this.root.append(heading);
		
		//Create our labels dropdown
		let dropdownWrapper = $(document.createElement('p'));
		let dropdownLabel = $(document.createElement('strong')).text('Classification Labels:');
		this.labelsDropdown = $(document.createElement('select')).attr('id', 'selected-labels');
		dropdownWrapper.append(dropdownLabel, this.labelsDropdown);
		this.root.append(dropdownWrapper);
		for (let labelKey of this.supportedLabels.keys())
		{
			let labelOption = $(document.createElement('option')).attr('value', labelKey).text(labelKey);
			this.labelsDropdown.append(labelOption);
		}
		
		//Create our label management buttons
		let showDirButton = $(document.createElement('button')).text('Show Label Files');
		let rescanButton = $(document.createElement('button')).text('Rescan');
		dropdownWrapper.append(showDirButton, rescanButton);
		
		//Wire up the "show label files" button
		showDirButton.click(() => {
			remote.shell.openItem(ClassificationLabelManager.labelsDirectory());
		});
		
		//Wire up the "rescan" button
		rescanButton.click(() => {
			this.transition.setState(LoadingLabelsState.identifier());
		});
		
		//Create our input directory chooser
		let inputDirChooser = this.createDirChooser(this.inputDirID, 'Input Directory: ');
		this.root.append(inputDirChooser);
		
		//Create our output directory chooser
		let outputDirChooser = this.createDirChooser(this.outputDirID, 'Output Directory: ');
		this.root.append(outputDirChooser);
		
		//Create our "Start Classification" button and wire up its event handler
		let startWrapper = $(document.createElement('p'));
		this.startButton = $(document.createElement('button')).text('Start Classification');
		startWrapper.append(this.startButton);
		this.root.append(startWrapper);
		this.startButton.click(() =>
		{
			//Disable the button during the state transition
			this.startButton.attr('disabled', 'disabled');
			
			//Transition to the classification state
			this.transition.setState(ClassifyImagesState.identifier(), {
				'inputDir':  this.getSelectedDirectory(this.inputDirID),
				'outputDir': this.getSelectedDirectory(this.outputDirID),
				'labels':    this.getSelectedLabels()
			});
		});
		
		//Perform initial form validation
		this.validateForm();
	}
}
