import { app, BrowserWindow } from 'electron';
import * as path from 'path';

//Maintain a reference to the main window to prevent it being freed prematurely
let mainWindow : Electron.BrowserWindow | null;

//Quit when all browser windows are closed
app.on('window-all-closed', function() {
	app.quit();
});

//Wait until Electron has completed startup initialisation
app.on('ready', function()
{
	//Create the main browser window
	mainWindow = new BrowserWindow({
		'width':          1280,
		'height':         720,
		'minWidth':       900,
		'minHeight':      600,
		'center':         true,
		'show':           false,
		'resizable':      true,
		'useContentSize': true,
		'fullscreenable': false
	});
	
	//Display the window only once initial loading is complete
	mainWindow.once('ready-to-show', () => {
		(<Electron.BrowserWindow>mainWindow).show();
	});
	
	//Make sure we release our reference to the main window when it is closed
	mainWindow.on('closed', function() {
		mainWindow = null;
	});
	
	//Load the main page of the UI
	mainWindow.loadURL('file://' + path.dirname(__dirname) + '/index.html');
});
