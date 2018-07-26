import { ClassificationLabelManager } from '../../core/ClassificationLabelManager';
import { SelectParametersState } from './SelectParametersState';
import { TransitionProvider } from '../TransitionProvider';
import { DialogProvider } from '../DialogProvider';
import { UIState } from '../UIState';
import { remote } from 'electron';
import * as $ from 'jquery';

export class LoadingLabelsState extends UIState
{
	public static identifier() {
		return 'loading-labels';
	}
	
	public getTitle() {
		return 'Load Classification Labels';
	}
	
	public constructor(transition : TransitionProvider, dialogs : DialogProvider) {
		super(LoadingLabelsState.identifier(), transition, dialogs);
	}
	
	public onShow(...args: any[]) : void
	{
		this.rescanLabels();
		super.onShow();
	}
	
	private rescanLabels()
	{
		//Display our loading message
		this.root.html('<p>Loading classification labels...</p>');
		
		//Attempt to load the supported classification labels
		ClassificationLabelManager.loadSupportedLabels()
		.then((supportedLabels : Map<string,string[]>)=>
		{
			//Determine if any labels were found
			if (supportedLabels.size == 0)
			{
				//Display the "no labels found" message with a link to the labels directory and a reload button
				let labelsDir = ClassificationLabelManager.labelsDirectory();
				this.root.html(`
					<h1>No classification labels found</h1>
					<p>Create a text file containing a list of labels (one label per line) in the following directory:</p>
					<p><a href="#">${labelsDir}</a></p>
					<p><button>Rescan</button></p>
				`);
				
				//Wire up the link to open the labels directory in the system file browser
				$('a', this.root).click(() => {
					remote.shell.openItem(labelsDir);
				});
				
				//Wire up the reload button
				$('button', this.root).click(() => {
					this.rescanLabels();
				});
			}
			else
			{
				//Transition to the directory selection state
				this.transition.setState(SelectParametersState.identifier(), {
					'supportedLabels': supportedLabels,
				});
			}
		})
		.catch((err : Error) => {
			this.dialogs.handleError(err);
		});
	}
}
