const { BrowserWindow, dialog } = require('electron').remote;
import { TransitionProvider } from './TransitionProvider';
import { DialogProvider } from './DialogProvider';
import { UIState } from './UIState';
import { remote } from 'electron';
import * as $ from 'jquery';

//Include each of the individual UI state classes
import { LoadingLabelsState } from './states/LoadingLabelsState';
import { SelectParametersState } from './states/SelectParametersState';
import { ClassifyImagesState } from './states/ClassifyImagesState';

export class UIStateManager implements DialogProvider, TransitionProvider
{
	//All of our supported states
	private states : Map<string,UIState>;
	
	//The currently active state
	private activeState! : UIState;
	
	//The default state that we load on startup
	private defaultState : string =  LoadingLabelsState.identifier();
	
	public constructor()
	{
		//Create our list of UI states
		this.states = new Map<string,UIState>();
		this.states.set(LoadingLabelsState.identifier(), new LoadingLabelsState(this, this));
		this.states.set(SelectParametersState.identifier(), new SelectParametersState(this, this));
		this.states.set(ClassifyImagesState.identifier(), new ClassifyImagesState(this, this));
		
		//Wire up our event handler for window resizes
		$(window).resize(() => {
			this.activeState.onResize();
		});
		
		//Transition to our default UI state
		this.setState(this.defaultState);
	}
	
	//Transitions from the current UI state into the specified state
	public setState(newState : string, ...extraArgs : any[]) : void
	{
		//Verify that the requested state exists
		if (this.states.has(newState))
		{
			//If we have an outgoing state, call its onHide() hook
			if (this.activeState !== undefined) {
				this.activeState.onHide();
			}
			
			//Transition into the new state
			this.activeState = <UIState>(this.states.get(newState));
			$('head title').text('Taxonomist - ' + this.activeState.getTitle());
			this.activeState.onShow(...extraArgs);
		}
		else {
			this.handleError(new Error('invalid state "' + newState + '"'));
		}
	}
	
	//Displays an error message to the user
	public handleError(err : Error) : void
	{
		//Only display stack traces when we are running in development mode
		let showStack : boolean = (require('electron-is-dev') === true);
		if (err.message !== undefined && err.stack !== undefined) {
			dialog.showErrorBox('Error', err.message + ((showStack === true) ? '\n\n' + err.stack : ''));
		}
		else {
			dialog.showErrorBox('Error', JSON.stringify(err));
		}
	}
	
	//Displays an informational message to the user
	public showMessage(message : string) : Promise<any>
	{
		return new Promise((resolve : Function, reject : Function) =>
		{
			dialog.showMessageBox({'message': message, 'buttons': ['OK']}, (response : number) => {
				resolve(true);
			});
		});
	}
	
	//Prompts the user for confirmation of an action
	public showConfirmDialog(message : string, confirmButtonLabel : string) : Promise<boolean>
	{
		return new Promise((resolve : Function, reject : Function) =>
		{
			dialog.showMessageBox({'message': message, 'buttons': [confirmButtonLabel, 'Cancel']}, (response : number) =>
			{
				if (response === 0) {
					resolve(true);
				}
				else {
					reject(false);
				}
			});
		});
	}
	
	//Prompts the user for an input path for opening a file or directory
	public showOpenDialog(title : string, filters : any[], chooseDirs? : boolean) : Promise<string[]>
	{
		return new Promise((resolve : Function, reject : Function) =>
		{
			dialog.showOpenDialog(
				BrowserWindow.getFocusedWindow(),
				{
					'title': title,
					'filters': filters,
					'properties': [((chooseDirs === true) ? 'openDirectory' : 'openFile')]
				},
				(paths : string[]) => {
					resolve(paths);
				}
			);
		});
	}
	
	//Prompts the user for an output file path for saving a file
	public showSaveDialog(title : string, filters : any[]) : Promise<string>
	{
		return new Promise((resolve : Function, reject : Function) =>
		{
			dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {'title': title, 'filters': filters}, (path : string) => {
				resolve(path);
			});
		});
	}
}
