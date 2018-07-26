Taxonomist
==========

Taxonomist is a simple graphical tool to facilitate the workflow of manually categorising images into classes so that they can be used as training data for image classification algorithms. It is primarily intended for use by artificial intelligence and computer vision researchers.

Features:

- Provides a single window from which large numbers of images can be quickly classified without the need to manually copy or move files.
- Images are copied into the destination directory, not moved, so the source directory remains completely unmodified.
- Provides a full undo stack so that classification choices can be immediately reverted and re-examined if necessary.
- Supports GIF, JPEG, and PNG images (unfortunately the TIFF format is not supported by Chromium.)

**You can download the installer for the latest version of Taxonomist from the [releases page](https://github.com/adamrehn/taxonomist/releases).**


## Contents

- [Using Taxonomist](#using-taxonomist)
- [Building Taxonomist from source](#building-taxonomist-from-source)
  - [Requirements](#requirements)
  - [Build process](#build-process)
- [Legal](#legal)


## Using Taxonomist

**First run:**

When you open Taxonomist, the tool will scan for available sets of classification labels. If none exist (as will be the case the very first time the tool is run), instructions will be displayed for creating label files. The instructions include a link that will open the directory where label files need to be placed. These files are just plain text files with a `.txt` extension that contain a list of classification labels (one label per line.) Once you have created at least one label file, click the "Rescan" button. The tool will detect the newly-added labels and proceed to the parameter selection screen.

If you want to create additional label files later on, the "Show Label Files" button on the parameter selection screen will open the directory where the files need to be placed, and the "Rescan" button will perform detection of newly-added or modified files.

**Parameter selection:**

On the parameter selection screen, you can choose which set of classification labels to use from the "Classification Labels" dropdown list. The entries in the list are the detected label files, with their `.txt` file extensions removed.

You must select an input directory containing the files to be classified and an output directory which will contain the classified files. Taxonomist will automatically create subdirectories for each classification label inside the output directory, so there is no need to do this yourself.

Once you have selected the labels and input and output directories, click the "Start Classification" button to proceed to the classification screen.

**Performing classification:**

The left-hand side of the classification screen displays the current image to be classified, whilst the right-hand side displays a panel with buttons for classifying the current image, as well as a button for ignoring the current image entirely (ignored images will not be copied to the output directory.)

Once you have ignored or classified the current image, the next image to be classified will be displayed. Each image from the source directory will be displayed in this manner until all images have been processed.

The outcome of the last action (ignore / classify as label) will be displayed at the bottom of the screen, accompanied by an "Undo" button. Clicking this button will revert the last action, deleting the file that was created in the output directory (if any) and moving back to the previous image. Taxonomist maintains a full undo stack, so you can use the "Undo" button to move all the way back to the first image if desired.


## Building Taxonomist from source

**Note: building Taxonomist from source is only required if you wish to modify the source code. This process is not necessary for researchers who simply want to use the tool as it is - the prebuilt installer for the latest version of Taxonomist can be downloaded from the [releases page](https://github.com/adamrehn/taxonomist/releases).**


### Requirements

Building Taxonomist from source requires [Node.js](https://nodejs.org/) version 8.0 or newer.


### Build process

First, install dependencies using:

```
npm install .
```

You can then run the application using:

```
npm run start
```

or package it using:

```
npm run dist
```

To clean the generated files, use:

```
npm run clean
```


## Legal

Copyright &copy; 2018, Adam Rehn. Licensed under the MIT License, see the file [LICENSE](./LICENSE) for details.
