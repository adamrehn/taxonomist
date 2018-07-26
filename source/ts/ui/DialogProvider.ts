//The system dialog box services that UIStateManager provides to UIState instances,
//factored out into an interface to avoid a circular dependency

export interface DialogProvider
{
	//Displays an error message to the user
	handleError(err : Error) : void;
	
	//Displays an informational message to the user
	showMessage(message : string) : Promise<any>;
	
	//Prompts the user for confirmation of an action
	showConfirmDialog(message : string, confirmButtonLabel : string) : Promise<boolean>;
	
	//Prompts the user for an input path for opening a file or directory
	showOpenDialog(title : string, filters : any[], chooseDirs? : boolean) : Promise<string[]>;
	
	//Prompts the user for an output file path for saving a file
	showSaveDialog(title : string, filters : any[]) : Promise<string>;
}
