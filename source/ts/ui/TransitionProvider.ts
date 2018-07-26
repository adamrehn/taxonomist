//The state transition services that UIStateManager provides to UIState instances,
//factored out into an interface to avoid a circular dependency

export interface TransitionProvider
{
	//Transitions from the current UI state into the specified state
	setState(newState : string, ...extraArgs : any[]) : void;
}
