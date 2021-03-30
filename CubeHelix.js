/*
 * CubeHelix.js
 * 
 * Display monochrome image as pseudo colour with 
 * windowing of colour range.
 * 
 * (C) Kevin Osborn 2021
 */

 #feature-id    Utilities > CubeHelix
 
 #feature-info  Script to display mono image as mapped pseudo colour\
                using Dave Green's CubeHelix algorithm \
                (https://astron-soc.in/bulletin/11June/289392011.pdf). 

#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/ColorSpace.jsh>

#define VERSION "1.0"
#define CMAP_WIDTH 550
#define CMAP_HEIGHT 50
#define RED 1
#define GREEN 2
#define BLUE 3

// #define PREVIEW_SIZE 400

function CubeHelixColourData()
{
    this.startColour = 0.0;
    this.rotations = 0.0;
    this.saturation = 0.0;
    this.gamma = 0.0;
    this.rotdir = 1;
    this.colourScale = null;
    this.sourceView = null;

    this.sourceView = ImageWindow.activeWindow.mainView;
    if (this.sourceView.isNull) {
        var msg = new MessageBox("Source image view must be selected", StdIcon_Error, StdButton_Ok);
        console.hide();
        msg.execute();
        throw new Error("Source image must be selected.");
    }

    this.preview = new ImageWindow(this.sourceView.image.width, this.sourceView.image.height,
        3, 32, true, true, "CubeHelix");
    this.preview.mainView.beginProcess(UndoFlag_NoSwapFile);
    this.preview.mainView.image.fill(0);
    this.preview.mainView.endProcess();
    this.preview.fitWindow();
    this.preview.zoomToOptimalFit();
    this.preview.show();

    this.updateImage = function() {
        if (this.sourceView.image.colorSpace != ColorSpace_Gray) {
            var msgBox = new MessageBox("Source image must be monochrome.", "CubeHelix Error", StdIcon_Error, StdButton_Ok);
            msgBox.execute();
            return;
        }

        console.show();
        console.writeln("Executing CubeHelix with");
        console.writeln("  Start colour ", format("%1.2f", this.startColour));
        console.writeln("  Rotations    ", format("%1.2f", this.rotations));
        console.writeln("  Saturation   ", format("%1.2f", this.saturation));
        console.writeln("  Gamma        ", format("%1.2f", this.gamma));
        console.writeln("  Rotation dir ", format("%d", this.rotdir));

        this.colourScale.update();

        var P = new ChannelCombination;
        P.colorSpace = ChannelCombination.prototype.RGB;
        P.channels = [ // enabled, id
            [true, this.sourceView.id],
            [true, this.sourceView.id],
            [true, this.sourceView.id]
        ];
        this.preview.mainView.beginProcess(UndoFlag_NoSwapFile);
        P.executeOn(this.preview.mainView);
        this.preview.mainView.endProcess();

        var angle = 2 * Math.PI * (this.startColour / 3.0 + 1 + this.rotations*this.rotdir);

        var P = new PixelMath;
        P.expression = "$T^" + this.gamma + " + (" + this.saturation + " * $T^" + this.gamma + " * (1 - $T) / 2.0) * (-0.14861 * cos(" + angle + " * $T) + 1.78277 * sin(" + angle + " * $T))";
        P.expression1 = "$T^" + this.gamma + " + (" + this.saturation + " * $T^" + this.gamma + " * (1 - $T) / 2.0)  * (-0.29227 * cos(" + angle + " * $T) + 0.90649 * sin(" + angle + " * $T))";
        P.expression2 = "$T^" + this.gamma + " + (" + this.saturation + " * $T^" + this.gamma + " * (1 - $T) / 2.0) * (1.97294 * cos(" + angle + " * $T))";
        P.expression3 = "";
        P.useSingleExpression = false;
        P.symbols = "";
        P.clearImageCacheAndExit = false;
        P.cacheGeneratedImages = false;
        P.generateOutput = true;
        P.singleThreaded = false;
        P.optimization = true;
        P.use64BitWorkingImage = false;
        P.rescale = false;
        P.rescaleLower = 0;
        P.rescaleUpper = 1;
        P.truncate = true;
        P.truncateLower = 0;
        P.truncateUpper = 1;
        P.createNewImage = false;
        P.showNewImage = false;
        P.newImageId = "";
        P.newImageWidth = 0;
        P.newImageHeight = 0;
        P.newImageAlpha = false;
        P.newImageColorSpace = PixelMath.prototype.RGB;
        P.newImageSampleFormat = PixelMath.prototype.i32;

        P.executeOn(this.preview.mainView);

        console.hide();
    }

    this.cubeHelix = function(fract, start, rotns, saturation, gamma, irgb) {
        var angle = 2 * Math.PI * (start / 3.0 + 1 + rotns * fract);
        var f = Math.pow(fract, gamma);
        var amp = saturation * f * (1 - fract) / 2.0;

        switch (irgb) {
            case RED:
                var r = f + amp * (-0.14861 * Math.cos(angle) + 1.78277 * Math.sin(angle));
                return Math.max(Math.min(r, 1.0), 0.0);
            case GREEN:
                var g = f + amp * (-0.29227 * Math.cos(angle) - 0.90649 * Math.sin(angle));
                return Math.max(Math.min(g, 1.0), 0.0);
            case BLUE:
                var b = f + amp * (1.97294 * Math.cos(angle));
                return Math.max(Math.min(b, 1.0), 0.0);
            default:
                return 0.0;
        }
    }

    this.updataParams = function(value) {
        console.writeln("Updating parameters... ", format("%1.2f", value));
    }
}

function MyDialog()
{
    this.__base__ = Dialog;
    this.__base__();

    this.onHide = function() {
        // data.preview.forceClose();
    }

    var sliderMinWidth = Math.round(this.font.width("Saturation parameter:") + 2.0 * this.font.width('M'));

    this.titleLabel = new Label(this);
    this.titleLabel.frameStyle = FrameStyle_Box;
    this.titleLabel.margin = 4;
    this.titleLabel.wordWrapping = true;
    this.titleLabel.useRichText = true;
    this.titleLabel.text = "<b>CubeHelix v" + VERSION + "</b>" +
                           "<p>This script is an adaptation of the cubehelix pseudo " +
                           "colour mapping scheme developed by Dave Green of the " +
                           "University of Cambridge.  The colour scheme was developed " +
                           "specifically for astronomical use and is described in his paper:</p>" +
                           "<p>&ldquo;Green, D. A., 2011, `A colour scheme for the display of astronomical " +
                           "intensity images', Bulletin of the Astronomical Society of India, 39, 289&rdquo; " +
                           "(https://astron-soc.in/bulletin/11June/289392011.pdf).</p>" +
                           "<p>Copyright &copy; Kevin Osborn 2021</p>";

    this.sourceSizer = new HorizontalSizer;
    this.sourceSizer.spacing = 4;
    this.sourceImageLabel = new Label(this);
    this.sourceImageLabel.text = "Source Image";
    this.sourceImageLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
    this.sourceImageViewList = new ViewList(this);
    this.sourceImageViewList.minWidth = 360;
    this.sourceImageViewList.getAll();
    this.sourceImageViewList.toolTip = "Select source image.";
    this.sourceImageViewList.onViewSelected = function(view) {
        data.sourceView = view;
    }

    this.sourceSizer.add(this.sourceImageLabel);
    this.sourceSizer.add(this.sourceImageViewList, 100);

    this.controlSizer = new VerticalSizer;
    this.controlSizer.margin = 6;
    this.controlSizer.spacing = 4;

    this.startColour = new NumericControl(this);
    this.startColour.label.text = "Start Colour:";
    this.startColour.label.minWidth = sliderMinWidth;
    this.startColour.slider.setRange(5, 300);
    this.startColour.slider.minWidth = 256;
    this.startColour.setRange(0.5, 3.0);
    this.startColour.setPrecision(2);
    this.startColour.setValue(0.5);
    this.startColour.toolTip = "Starting colour (1.0 red, 2.0 green, 3.0 blue)."
    this.startColour.onValueUpdated = function(value) {
        //data.updataParams(value);
        data.startColour = value;
    }
    data.startColour = this.startColour.value;

    this.rotations = new NumericControl(this);
    this.rotations.label.text = "Number of Rotations:";
    this.rotations.label.minWidth = sliderMinWidth;
    this.rotations.slider.setRange(0, 200);
    this.rotations.slider.minWidth = 256;
    this.rotations.setRange(0.0, 2.0);
    this.rotations.setPrecision(2);
    this.rotations.setValue(1.0);
    this.rotations.onValueUpdated = function(value) {
        //data.updataParams(value);
        data.rotations = value;
    }
    data.rotations = this.rotations.value;

    this.saturationParam = new NumericControl(this);
    this.saturationParam.label.text = "Saturation parameter:";
    this.saturationParam.label.minWidth = sliderMinWidth;
    this.saturationParam.slider.setRange(0, 200);
    this.saturationParam.slider.minWidth = 256;
    this.saturationParam.setRange(0.0, 2.0);
    this.saturationParam.setPrecision(2);
    this.saturationParam.setValue(1.0);
    this.saturationParam.onValueUpdated = function(value) {
        //data.updataParams(value);
        data.saturation = value;
    }
    data.saturation = this.saturationParam.value;

    this.gammaParam = new NumericControl(this);
    this.gammaParam.label.text = "Gamma parameter:";
    this.gammaParam.label.minWidth = sliderMinWidth;
    this.gammaParam.slider.setRange(20, 160);
    this.gammaParam.slider.minWidth = 256;
    this.gammaParam.setRange(0.2, 1.6);
    this.gammaParam.setPrecision(2);
    this.gammaParam.setValue(1.0);
    this.gammaParam.onValueUpdated = function(value) {
        //data.updataParams(value);
        data.gamma = value;
    }
    data.gamma = this.gammaParam.value;

    this.directionSizer = new HorizontalSizer(this);
    this.directionSizer.spacing = 4;
    this.directionSizer.margin = 6;

    this.rotationLabel = new Label(this);
    this.rotationLabel.text = "Rotation Direction:";
    this.posRadioButton = new RadioButton(this);
    this.posRadioButton.text = "Positive";
    this.posRadioButton.checked = true;
    this.posRadioButton.onCheck = function(checked) {
        if (checked)
            data.rotdir = 1;
    }
    this.negRadioButton = new RadioButton(this);
    this.negRadioButton.text = "Negative";
    this.negRadioButton.onCheck = function(checked) {
        if (checked)
            data.rotdir = -1;
    }
    data.rotdir = this.posRadioButton.checked ? 1 : -1;

    this.directionSizer.add(this.rotationLabel);
    this.directionSizer.add(this.posRadioButton);
    this.directionSizer.add(this.negRadioButton);

    this.previewColourMap = new Control(this);

    this.previewColourMap.setFixedSize(CMAP_WIDTH, CMAP_HEIGHT);
    data.colourScale = this.previewColourMap;
    this.previewColourMap.onPaint = function() {
        var gfx = new Graphics(this);
        for (var i = 0; i < CMAP_WIDTH; i++) {
            var fract = i/(CMAP_WIDTH-1);
            var r = data.cubeHelix(fract, data.startColour, data.rotations*data.rotdir, data.saturation, data.gamma, RED);
            var g = data.cubeHelix(fract, data.startColour, data.rotations*data.rotdir, data.saturation, data.gamma, GREEN);
            var b = data.cubeHelix(fract, data.startColour, data.rotations*data.rotdir, data.saturation, data.gamma, BLUE);
            var red = Math.max(Math.min(Math.floor(255*r), 255), 0);
            var green = Math.max(Math.min(Math.floor(255*g), 255), 0);
            var blue = Math.max(Math.min(Math.floor(255*b), 255), 0);

            var rgb = 0xff000000 + (red << 16) + (green << 8) + blue;
            gfx.pen = new Pen(rgb);
            gfx.drawLine(i, 0, i, CMAP_HEIGHT);
        }
        gfx.end();
    };

    this.controlSizer.add(this.startColour);
    this.controlSizer.add(this.rotations);
    this.controlSizer.add(this.saturationParam);
    this.controlSizer.add(this.gammaParam);
    this.controlSizer.add(this.directionSizer);
    this.controlSizer.add(this.previewColourMap);

    this.applyButton = new PushButton(this);
    this.applyButton.text = "Apply";
    this.applyButton.icon = this.scaledResource(":/icons/gears.png");
    this.applyButton.onClick = function() {
        data.updateImage();
    }

    this.okButton = new PushButton(this);
    this.okButton.text = "OK";
    this.okButton.icon = this.scaledResource(":/icons/ok.png");
    this.okButton.onClick = function() {
        this.dialog.ok();
    }

    this.cancelButton = new PushButton(this);
    this.cancelButton.text = "Cancel";
    this.cancelButton.icon = this.scaledResource(":/icons/cancel.png");
    this.cancelButton.onClick = function() {
        data.preview.forceClose();
        this.dialog.cancel();
    }
    
    this.buttonSizer = new HorizontalSizer(this);
    this.buttonSizer.margin = 6;
    this.buttonSizer.spacing = 4;
    this.buttonSizer.add(this.applyButton);
    this.buttonSizer.addStretch();
    this.buttonSizer.add(this.cancelButton);
    this.buttonSizer.add(this.okButton);
    this.buttonSizer.minWidth = 300;

    this.sizer = new VerticalSizer;
    this.sizer.margin = 6;
    this.sizer.spacing = 6;
    this.sizer.add(this.titleLabel);
    this.sizer.add(this.sourceSizer);
    this.sizer.add(this.controlSizer);
    this.sizer.add(this.buttonSizer);

    this.windowTitle = "Cubehelix Pseudocolour Mapping";

    this.adjustToContents();
    this.setFixedSize();
}

function main()
{
    var dlg = new MyDialog;
    dlg.execute();    
}

MyDialog.prototype = new Dialog;
var data = new CubeHelixColourData;

main();
