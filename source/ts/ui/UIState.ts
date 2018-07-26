import { TransitionProvider } from './TransitionProvider';
import { DialogProvider } from './DialogProvider';
import * as $ from 'jquery';

export class UIState
{
	//Our state transition provider
	protected transition : TransitionProvider;
	
	//Our system dialog box provider
	protected dialogs : DialogProvider; 
	
	//Our root <div> element
	protected root! : JQuery<HTMLElement>;
	
	//Stores the reference to our dialog provider and creates the root <div> element
	public constructor(id : string, transition : TransitionProvider, dialogs : DialogProvider)
	{
		this.transition = transition;
		this.dialogs = dialogs;
		this.createRoot(id);
	}
	
	//Specifies the title that should be shown in the application's title bar while the state is visible
	public getTitle() {
		return '';
	}
	
	//Called when the state is transitioned into
	public onShow(...args: any[]) : void {
		this.root.show();
	}
	
	//Called when the state is transitioned out of
	public onHide() : void {
		this.root.hide();
	}
	
	//Called whenever the state is active and the window is resized
	public onResize() : void {}
	
	//Helper function to create the root <div> element, designed to be called by derived class constructors
	protected createRoot(id : string) : void
	{
		this.root = $(document.createElement('div'));
		this.root.addClass('state');
		this.root.attr('id', id);
		this.root.hide();
		$('body').append(this.root);
	}
}
