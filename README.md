CubeHelix PixInsight Plugin
===========================

This script is a Javascript plugin for PixInsight.  It is an adaptation of the cubehelix pseudo colour mapping scheme developed by Dr Dave Green of the Battcock Centre for Experimental Astrophysics Cavendish Laboratory at the University of Cambridge.  The colour scheme was developed specifically for astronomical use and is described in his paper, "Green, D. A., 2011, A colour scheme for the display of astronomical intensity images, Bulletin of the Astronomical Society of India, 39, 289"
(https://astron-soc.in/bulletin/11June/289392011.pdf)

### Installation ###
To install, copy CubeHelix.js into the src/scripts directory of the PixInsight installation directory.  Select the "Script > Feature Scripts..." menu option, click the "Add" button then select the CubeHelix script. If you don't want to include the script in the PixInsight installation then select the "Script > Execute Script File..." menu option and navigate to the location of the CubeHelix script.

### Algorithm ###
Pseudocolour mapping is a technique frequently used in medical imaging and scientific applications where intensity (or brightness of pixels) in a monochrome image is mapped to arbitrarily assigned colours to enhance the visualisation of variations in intensity.  The cubehelix algorithm is illustrated with the following image (borrowed from Dave Green's website at http://www.mrao.cam.ac.uk/~dag/CUBEHELIX/) where the intensity values are represented by the diagonal of the cube and the mapped red, green and blue components are calculated based on the helix rotating around the diagonal.  The number of rotations of the helix, the direction of rotation and the starting colour determine the mapped colour, while the saturation parameter determines the distance of the helix from the diagonal and therefore the degree of saturation of the calculated colours.

![cubehelix colour scheme](/img/cubehelix.png)

An example is given with the following images which are a hyydrogen-alpha image of the Helix Nebula (NGC 7293) before and after application of the plugin.

![Ha image](/img/Helix_Ha.png "Hydrogen-alpha")
![Cubehelix image](/img/CubeHelix.png "Cubehelix")
