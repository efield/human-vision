/*************************************************************************************************

                                    Defined Variables

*************************************************************************************************/
// Requires
var fs = require("fs"); // Filesystem
var ExifImage = require("exif").ExifImage; // Metadata Read
var os = require('os'); // For reading line breaks
var moment = require('moment'); // Library for easy access of dates (http://momentjs.com/)
moment().format(); // Part of initializing the moment library
var QrCode=require("qrcode-reader"); // Library for reading data from QR

// Array Declarations and Array Counters
var coordinates = new Array(); // Stores pixel coordinates of clicked points. Used to connect the points with lines
var counter = 0; // counter/2 = number of clicked points. Even values = Width coordinate. Odd values = Height Coordinate

var GPSClickedCoords = new Array(); // Stores the computed GPS Latitude and Longitude values for each clicked point
var coordsCount=0; // coordsCount/2 = number of Points clicked. Even values = Latitude. Odd values = Longitude 

var masterData = new Array(); // Stores all data collected and computed for each image. (Write out final format for the order of array here)
var masterCounter; // Stores data into order of array. 0=Timestamp ...... (finish for rest of array data)

// Universal constants
var R = 6371 // km
var centerPixelWidth = 768;
var centerPixelHeight = 432;
var pixelWRad = 0.061458*Math.PI/180; // rad comes from Width IFOV calc 94.4/1536
var pixelHRad = 0.063657*Math.PI/180; // rad comes from Height IFOV calc 55/864

// Data obtained from metadata
var timestamp; // Timestamp when image was taken
var lat1; // = Latitude of plane where image was taken
var long1; // Longitude of plane where image was taken
var altitude; // Altitude when image was taken
var initialHeading; // Heading of the plane in rad when image was taken (converted to deg 0==N 90==E 180==S 270==W)

// Clicked Pixel Coordinates
var pixelW2; // Clicked Width Coord
var pixelH2; // Clicked Height Coord

//Variable declarations for GPS computations
var heading; // taken in rad
var headingDeg; // in deg
var lat2; // calculated latitude of selected point
var long2; // calculated longitude of selected point
var deltaW; // distance from GPS Latitude coodinate to selected Coordinate Latitude on the ground
var deltaH; // distance from GPS Longitude coodinate to selected Coordinate Longitude on the ground
var distance; // distance on the ground between the center GPS Coordinate and the Selected Coordinate

var address2; // Address for first document in the Images2Process folder

// Variables for calculating the distance between two GPS locations (Haversine Function)
var a; // First part of Haversine Function
var c; // Second part of Haversine Function
var counter1=0; // Latitude index counter (even numbers)
var counter2=1; // Longitude index counter (odd numbers)

var groundDistBetweenPoints = new Array(); // Stores the calculated length between two GPS coordinates in meters
var counter3=0; // Counter for groundDistBetweenPoints for the distances connecting clicks
var checkLength; // Number of points clicked
var index_dist; // Counter for groundDistBetween Points for the extra distances required for area calculation
var latCoordIndex=4; // Starting latitudeCoord in GPSClickedCoords array for additional distances (2 gets added to this index for every extra distance calculated)

// Variables for calculating the shape area (Heron's Function)
var s= new Array(); // Contains the semiperimeter length for each component triangles
var countSemiPerim=0; // Indicates current component triangle
var AreaTotal; // Total area of the shape in m^2
var A = new Array() // Areas of each ofthe component triangles

// Variables for component triangle areas
var numIterations; // Total number of triangles in case 2 for the given shape (#component triangles-2)
var dist_counter=2; // Starting index for these special component triangles
var count_componentTriangles=0; // Current number of component triangles
var numPoints; // Sets the second and third indicies in the area calculation (starts at GPSClickedCoords.length/2 corresponding to the first additional calculated legth)

// Variables for calculating centroid (uses lat and long averages)
var centroidLat=0; // Centroid Latitude Coordinate in deg
var centroidLong=0; // Centroid Longitude Coordinate in deg
var p=0; // counter for suming GPS Coordinate values
var sumLat=0; // Sum of Latitude Coordinates
var sumLong=0; // Sum of Longitude Coordinates

// Variables for Probe Drop Location
var probeDropCoords = new Array(); // Stores the pixel coordinates that were clicked
var countPD=0; // index for probeDropCoords
var GPSClickedCoordsProbeDrop = new Array(); // Stores the Latitude and Longitude of the Probe Drop Locations
var countPDIndex=0; // index for GPSClickedCoordsProbeDrop

// Variables for Point Target Location
var pointTargetCoords = new Array(); // Stores pixel coordinates that were clicked
var countPT=0; // index for pointTargetCoords
var GPSClickedCoordsPointTarget = new Array(); // Stores the Latitude and Longitude of the Probe Drop Locations
var countPDIndex=0; // index for GPSClickedCoordsPointTarget

//Variables for QR Code Reading
var QRCodeCoords = new Array(); // Stores the pixel x and y coordinates where clicked
var countQR=0; // index for QRCodeCoords
var setWidth; // Calculated width of selected area of image 
var setHeight; // Calculated height of selected area of image
var QRCodeScannedData; // Stores the text data recieved after decoding the QR Code

//Variables for getting metadata from image
var meta; // Gets the metadata string from the image
var meta_Data = new Array(); // Splits the string into component strings, isolating each data point into each index of the array 

// For metadata read from .csv file
var address4; // Address for first text file corresponding to loaded image
var imageData = new Array(); // Stores metadata read from file

/*************************************************************************************************

                        Function For Resetting All Variables

*************************************************************************************************/
function resetVariables()
{
    coordinates=[];
    counter=0;
    masterData=[];
    masterCounter=1;
    GPSClickedCoords=[];
    coordsCount=0;
    timestamp=0;
    groundDistBetweenPoints=[];
    counter1=0;
    counter2=1;
    counter3=0;

    centroidLat=0;
    centroidLong=0;
    p=0;
    sumLat=0;
    sumLong=0;

    GPSClickedCoordsProbeDrop=[];
    countPD=0;
    countPDIndex=0;

    GPSClickedCoordsPointTarget=[];
    countPT=0;
    countPTIndex=0;

    latCoordIndex=4;

    s=[];
    A=[];
    AreaTotal=0;
    countSemiPerim=0;
    dist_counter=2;
    count_componentTriangles=0;

    QRCodeCoords=[];
    countQR=0;

    meta_Data=[];
    //QRCodeScannedData=0; Will display error code when this is commented out
}
/*************************************************************************************************

                                BUTTON CLICKING FUNCTIONS

*************************************************************************************************/

//If no target is selected the file is moved from the 'To process folder' to the 'Deleted folder'
document.getElementById("NoTarget").onclick = function transferDeleted() 
{
    fs.readdir("../human-vision/Images_2_Process", function(err,files3)
        {
            if (err) throw err;
            //console.log(files3);        
            
            fs.rename("../human-vision/Images_2_Process/" + files3[0],"../human-vision/Deleted/" + files3[0], function(err) 
                {
                    if (err) throw err;
                    alert("File successfully Deleted");
                })
        })
}    

// Loads newest image from folder into the canvas
document.getElementById("Load").onclick = function loadNewImage() 
{
    resetVariables();
    removeEventListeners();
    resetOnscreenDisplay();
    clearDisplays();

    fs.readdir("../human-vision/Images_2_Process", function(err, files2)
    {
        if (err) throw err;
        //console.log(files2);

        address2 = "../human-vision/Images_2_Process/" + files2[0];

        var img = new Image();
        img.src = address2;
        var canvas = document.getElementById('myCanvas');
        var ctx = canvas.getContext('2d');

        img.onload = function() 
        {
            ctx.drawImage(img,0,0,1536,864);
            img.style.display = 'none';
        };

        // Retrives metadata from image
        new ExifImage({ image : address2 }, function (error, exifData) {
        if (error)
        console.log("Error: "+error.message);
        else
            meta = exifData.exif.UserComment.toString();
            meta_Data = meta.split(" "); // 0 = Lat, 1=Long, 2=Altitude, 3=Heading, 4=Timestamp (optional)
            console.log(meta_Data);
        });
    });

        //Reading metadata from .txt files
    fs.readdir("../human-vision/Metadata", function(err, files4)
    {
        if (err) throw err;
            
        address4 = "../human-vision/Metadata/" + files4[0];
        
        // Asynchronous read data from file into an array
        fs.readFile(address4, "UTF-8", function (err, data) 
        {
            if (err) throw err;
            {
                imageData = data.split(","); // removes all "," from the string so "1,2,3" => "1","2","3"

                metadata2Variables();
            
            }
        });

    });
};

// Enables the double click action to select verticies of a target
document.getElementById("SelectVerticies").onclick = function SelectVerticies()
    {
        removeEventListeners();

        coordinates[counter]=document.addEventListener("dblclick", getSelectVerticies, false);
    };

document.getElementById("ProbeDropLoc").onclick = function ProbeDropLoc()
{
    removeEventListeners();

    probeDropCoords[countPD]=document.addEventListener("dblclick",getProbeDropCoords,false);
}

document.getElementById("PointTarget").onclick = function PointTrargetLoc()
{
    removeEventListeners();

    pointTargetCoords[countPT]=document.addEventListener("dblclick",getPointTargetCoords,false);
}

document.getElementById("QRCode").onclick= function QRCode()
{
   removeEventListeners();

    QRCodeCoords[countQR]=document.addEventListener("dblclick",getQRCodeCoords,false);
}

// Removes all drawings done on layer2
document.getElementById("Clear").onclick = function clearLayer()
    {
        resetVariables();
        removeEventListeners();
        resetOnscreenDisplay();
        clearDisplays();
    }

// Connects the selected verticies and does necessary calculations. Works for shapes with up to 8 verticies
document.getElementById("Compute").onclick = function Compute()
    {
        if(coordinates.length/2<=8) // Triangle
            {    
                connectClickedPoints();
                distBetweenPoints();
                calculateArea();
                //computeArea(); Simpler method ... broken

                calculateCentroidCoords();

                data2Screen();
            }
    };

//If no target is selected the file is moved from the 'To process folder' to the 'Processed folder'
document.getElementById("Process").onclick = function transferProcessed()
{
    fs.readdir("../human-vision/Images_2_Process", function(err,files3)
    {
        if (err) throw err;

        data2Master();

        fs.rename("../human-vision/Images_2_Process/" + files3[0],"../human-vision/Processed_Images/" + files3[0], function(err)
        {
            if (err) throw err;
            alert("File successfully Processed");

        })
    })
};

/*************************************************************************************************

    Event Listener Functions for Select Verticies, Probe Drop, Point Target and QR Code Buttons

*************************************************************************************************/

// Obtains XY coordinates of the click on the canvas image and places a red square on layer2 on the location of the click
function getSelectVerticies(e)
    {
   
        if (counter>=16)
            {
                document.removeEventListener("dblclick",getSelectVerticies,false);
                alert("removed click listener");
            }

        else
        {
            var rect = document.getElementById("myCanvas").getBoundingClientRect();
            var x= e.clientX - rect.left;
            var y= e.clientY - rect.top;
        
            coordinates[counter]=x; //all even numbered values are x coordinates
            pixelW2=x;// need to make into an array to store all of the GPS data and headings
            counter+=1;

            coordinates[counter]=y; // all odd numbered values are y coordinates
            pixelH2=y; // need to put into the array to store all the GPS data and headings
            counter++;

            computeSelectVerticiesGPSCoord(); // calls function to calculate GPS coordinate of each click

            var c = document.getElementById("layer2");
            var ctx = c.getContext("2d");
            ctx.beginPath();
            ctx.fillStyle="#ff0000";
            ctx.fillRect(x,y,7,7);
            ctx.stroke();
        }
        console.log(coordinates);
    };

function getProbeDropCoords(e)
{
    if (countPD>1)
        {
            document.removeEventListener("dblclick",getProbeDropCoords,false);
        }
    else
    {
        var rect = document.getElementById("myCanvas").getBoundingClientRect();
        var x= e.clientX - rect.left;
        var y= e.clientY - rect.top;

        probeDropCoords[countPD]=x;
        pixelW2=x;
        countPD++;
        probeDropCoords[countPD]=y;
        pixelH2=y;
        countPD++;

        computeProbeDropGPSCoords();

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle="#0000ff";
        ctx.fillRect(x,y,7,7);
        ctx.stroke();
    }
}

function getPointTargetCoords(e)
{
    if(countPT>5)
    {
        document.removeEventListener("dblclick",getPointTargetCoords,false)
    }
    else
    {
        var rect = document.getElementById("myCanvas").getBoundingClientRect();
        var x= e.clientX - rect.left;
        var y= e.clientY - rect.top;

        pointTargetCoords[countPT]=x;
        pixelW2=x;
        countPT+=1;
        pointTargetCoords[countPT]=y;
        pixelH2=y;
        countPT++;

        computePointTargetGPSCoords();

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle="#ffa500";
        ctx.fillRect(x,y,7,7);
        ctx.stroke();
    }
}

function getQRCodeCoords(e)
{

    if (countQR>3)
    {
        document.removeEventListener("dblclick",getQRCodeCoords,false);
    }
    else
    {
        var rect = document.getElementById("myCanvas").getBoundingClientRect();
        var x= e.clientX - rect.left;
        var y= e.clientY - rect.top;

        QRCodeCoords[countQR]=x;
        countQR++;
        QRCodeCoords[countQR]=y;
        countQR++;

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle="#551a8b";
        ctx.fillRect(x,y,7,7);
        ctx.stroke();

        if (countQR==4)
        {
            transferQRCodeImage();
        }
    }
}

document.addEventListener('mousedown', function(e){ e.preventDefault(); }, false); // removes highlighting of text when double clicking

function removeEventListeners()
{
    document.removeEventListener("dblclick",getSelectVerticies,false);
    document.removeEventListener("dblclick",getProbeDropCoords,false);
    document.removeEventListener("dblclick",getPointTargetCoords,false);
    document.removeEventListener("dblclick",getQRCodeCoords,false);  
}

/*************************************************************************************************

                        Functions for On Screen Display of Data

*************************************************************************************************/

function data2Screen()
{
    if (typeof AreaTotal !== 'undefined' && AreaTotal !== null && AreaTotal !==0)
    {
        document.getElementById("AreaCalc").innerHTML = AreaTotal+" m^2";
    }

    if (typeof centroidLat>0 || centroidLat<0 && centroidLat !==0 && typeof centroidLong>0 || centroidLong<0 && centroidLong!==0)
    {
        document.getElementById("CentroidCalc").innerHTML = centroidLat*180/Math.PI+","+centroidLong*180/Math.PI;
    }

    if (typeof GPSClickedCoordsProbeDrop[0] !== 'undefined' && GPSClickedCoordsProbeDrop[0] !== null && GPSClickedCoordsProbeDrop[0] !==0 && typeof GPSClickedCoordsProbeDrop[1] !== 'undefined' && GPSClickedCoordsProbeDrop[1] !== null && GPSClickedCoordsProbeDrop[1] !==0)
    {
        document.getElementById("ProbeDropCalc").innerHTML = GPSClickedCoordsProbeDrop[0]*180/Math.PI+","+GPSClickedCoordsProbeDrop[1]*180/Math.PI;    
    }

    if (GPSClickedCoordsPointTarget[0] !== 'undefined' && GPSClickedCoordsPointTarget[0] !== null && GPSClickedCoordsPointTarget[0] !==0 && typeof GPSClickedCoordsPointTarget[1] !== 'undefined' && GPSClickedCoordsPointTarget[1] !== null && GPSClickedCoordsPointTarget[1] !==0)
    { 
        document.getElementById("PointTargetCalcPT1").innerHTML = GPSClickedCoordsPointTarget[0]*180/Math.PI+","+GPSClickedCoordsPointTarget[1]*180/Math.PI;
    }

    if (GPSClickedCoordsPointTarget[2] !== 'undefined' && GPSClickedCoordsPointTarget[2] !== null && GPSClickedCoordsPointTarget[2] !==0 && typeof GPSClickedCoordsPointTarget[3] !== 'undefined' && GPSClickedCoordsPointTarget[3] !== null && GPSClickedCoordsPointTarget[3] !==0)
    { 
        document.getElementById("PointTargetCalcPT2").innerHTML = GPSClickedCoordsPointTarget[2]*180/Math.PI+","+GPSClickedCoordsPointTarget[3]*180/Math.PI;
    }

    if (GPSClickedCoordsPointTarget[4] !== 'undefined' && GPSClickedCoordsPointTarget[4] !== null && GPSClickedCoordsPointTarget[4] !==0 && typeof GPSClickedCoordsPointTarget[5] !== 'undefined' && GPSClickedCoordsPointTarget[5] !== null && GPSClickedCoordsPointTarget[5] !==0)
    { 
        document.getElementById("PointTargetCalcPT3").innerHTML = GPSClickedCoordsPointTarget[4]*180/Math.PI+","+GPSClickedCoordsPointTarget[5]*180/Math.PI;
    }
    if (QRCodeScannedData !== 'Undefined' && QRCodeCoords !== null && QRCodeScannedData!==0)
    {
        document.getElementById("QRData").innerHTML = QRCodeScannedData;
    }
}

function resetOnscreenDisplay()
{
    document.getElementById("AreaCalc").innerHTML = "-";
    document.getElementById("CentroidCalc").innerHTML = "-,-";
    document.getElementById("ProbeDropCalc").innerHTML = "-,-";
    document.getElementById("PointTargetCalcPT1").innerHTML = "-,-";
    document.getElementById("PointTargetCalcPT2").innerHTML = "-,-";
    document.getElementById("PointTargetCalcPT3").innerHTML = "-,-";
    document.getElementById("QRData").innerHTML="-";
}

function clearDisplays()
{
    var c = document.getElementById("layer2");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.clearRect(0, 0, layer2.width, layer2.height);

    var c1 = document.getElementById("qrcodedata");
    var ctx1 = c1.getContext("2d");
    ctx1.beginPath();
    ctx1.clearRect(0,0,qrcodedata.width,qrcodedata.height);
}

/*************************************************************************************************

                        Function For Connecting of Clicked Points

*************************************************************************************************/
// Connects Selected Verticies With A Line
function connectClickedPoints()
{
    var c = document.getElementById("layer2");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    var t=2;

    ctx.moveTo(coordinates[0],coordinates[1]);

    while(t<coordinates.length)
    {
        ctx.lineTo(coordinates[t],coordinates[t+=1]);
        t++;
    }
    
    ctx.lineTo(coordinates[0],coordinates[1]);
    ctx.stroke();
}

/*************************************************************************************************

                    Functions For Reading Image Metadata and QR Code Data

*************************************************************************************************/
function metadata2Variables()
{
    lat1=imageData[0]*Math.PI/180; // converts deg to rad
    long1=imageData[1]*Math.PI/180; // converts deg to rad
    altitude=imageData[2]; // recieves in meters
    initialHeading=imageData[3]*Math.PI/180; // converts deg to rad
    timestamp=imageData[4];

    // Assigning metadata read from image

    // lat1=meta_Data[0]*Math.PI/180; // converts deg to rad
    // long1=meta_Data[1]*Math.PI/180; // converts deg to rad
    // altitude=meta_Data[2]; // recieves in meters
    // initialHeading=meta_Data[3]*Math.PI/180; // converts deg to rad
    // timestamp=meta_Data[4];
}

function transferQRCodeImage()
    {
        qr= new QrCode();
        qr.callback= function(result)
        {
            QRCodeScannedData=result;
            alert(result);
            //console.log(result); // this is the info we get from the QR Code
        }
        setWidth = Math.abs(Math.round(QRCodeCoords[0]-QRCodeCoords[2]));
        setHeight = Math.abs(Math.round(QRCodeCoords[1]-QRCodeCoords[3]));

        var c1 = document.getElementById("myCanvas");
        var c2 = document.getElementById("qrcodedata");
        var ctx1 = c1.getContext("2d");
        var ctx2 = c2.getContext("2d");

        var imgData1 = ctx1.getImageData(QRCodeCoords[0],QRCodeCoords[1],setWidth,setHeight);
        ctx2.putImageData(imgData1,0,0);
        qr.decode(imgData1); // decodes the QR Code to get the result
    }
/*************************************************************************************************

        Functions For Adding Data to Master Array and Printing Master Array to Data Log

*************************************************************************************************/
function data2Master()
{

    var now = new moment();
    
    masterData[0]=now.format("HH:mm:ss");

    masterCounter=1;

    masterData[masterCounter]=A;
    masterCounter++;

    masterData[masterCounter]=centroidLat;
    masterCounter++;

    masterData[masterCounter]=centroidLong;
    masterCounter++;

    for(var j=0;j<GPSClickedCoordsProbeDrop.length;j++)
    {
        masterData[masterCounter]=GPSClickedCoordsProbeDrop[j];
        masterCounter++;
    }

    for(var j=0;j<GPSClickedCoordsPointTarget.length;j++)
    {
        masterData[masterCounter]=GPSClickedCoordsPointTarget[j];
        masterCounter++;
    }

    console.log(masterData);
    write2DataLog();
}

function write2DataLog()
{
    fs.appendFile("C:/Users/Eric/human-vision/DataLogs/Log.txt", masterData +"\r\n", function(err) // \r\n is a line break
        {  
            if (err) throw err;
        }
)};

/*************************************************************************************************

        Functions to Calculate GPS Coordinate from Click Location

*************************************************************************************************/
// Takes Clicked Pixel Coordinates and Calculates Distance From Known GPS Coordiate
function pixelDistanceFromCenter()
{
    
    deltaW= altitude*Math.tan((pixelW2-centerPixelWidth)*pixelWRad); // km
    deltaH= altitude*Math.tan((pixelH2-centerPixelHeight)*pixelHRad); // km
    distance= Math.sqrt(deltaW*deltaW+deltaH*deltaH); // km
    //alert(distance+"km");
};

// Calculates new GPS Coordinate based on distance from known GPS Coordinate
function computeNewCoordinates()
{
    lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(heading)));//*180/Math.PI;
    long2 = (long1 + Math.atan2(Math.sin(heading)*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat2)));//*180/Math.PI;
};

/*************************************************************************************************

Stores Calculated GPS Coordinates in an appropriate array for Select Verticies, Probe Drop and Point Target

*************************************************************************************************/
function storeClickedCoords()
{
    GPSClickedCoords[coordsCount]=lat2;
    coordsCount+=1;

    GPSClickedCoords[coordsCount]=long2;
    coordsCount++;

    console.log(GPSClickedCoords);
}

function storePDClickedCoords()
{
    GPSClickedCoordsProbeDrop[countPDIndex]=lat2;
    countPDIndex+=1;

    GPSClickedCoordsProbeDrop[countPDIndex]=long2;
    countPDIndex++;
    //alert(GPSClickedCoordsProbeDrop);
}

function storePTClickedCoords()
{
    GPSClickedCoordsPointTarget[countPTIndex]=lat2;
    countPTIndex+=1;
    
    GPSClickedCoordsPointTarget[countPTIndex]=long2;
    countPTIndex++;

    //alert(GPSClickedCoordsPointTarget);
}

/*************************************************************************************************

        Compute GPS Coordinates for Select Verticies, Probe Drop and Point Target

*************************************************************************************************/
// Uses Distance calculated from click to compute new GPS coordinate based on 9 cases
function computeGPSCoordFromCase()
{
        if (deltaW==0 && deltaH==0)
    {
        heading = initialHeading*180/Math.PI;
        lat2 = lat1;//*180/Math.PI;
        long2 = long1;//*180/Math.PI;
        
        //alert("Case 1: "+lat2+", "+long2+", "+heading+"deg");
    }
    else if (deltaW==0 && deltaH<0)
    {
        //long2=long1
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(initialHeading)));//*180/Math.PI;
        long2 = long1;//*180/Math.PI;
        heading = initialHeading*180/Math.PI;
        
        //alert("Case 2: "+lat2+", "+long2+", "+heading+"deg");
    }
    else if (deltaW==0 && deltaH>0)
    {
        //long2=long1
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(initialHeading+Math.PI)));//*180/Math.PI;
        long2=long1;//*180/Math.PI;
        heading = (initialHeading+Math.PI)*180/Math.PI;

        //alert("Case 3: "+lat2+", "+long2+", "+heading+"deg");
    }
    else if (deltaW>0 && deltaH==0)
    {
        //lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(initialHeading+(Math.PI/2))*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat1)));//*180/Math.PI;
        lat2 = lat1;//*180/Math.PI;
        heading=(initialHeading+Math.PI/2)*180/Math.PI;
        
        //alert("Case 4: "+lat2+", "+long2+", "+heading+"deg"); 
    }
    else if (deltaW<0 && deltaH==0)
    {
        //lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(initialHeading+(3*Math.PI/2))*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat1)));//*180/Math.PI;
        lat2 = lat1;//*180/Math.PI;
        heading = (initialHeading+3*Math.PI/2)*180/Math.PI;

        //alert("Case 5: "+lat2+", "+long2+", "+heading+"deg");
    }
    else if (deltaW>0 && deltaH<0)
    {   
        heading = initialHeading + (Math.atan(deltaW/(-1*deltaH))); //*Math.PI/180;
        computeNewCoordinates();
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 6: "+lat2+", "+long2+", "+headingDeg+" deg");
    }
    else if (deltaW>0 && deltaH>0)
    {
        heading = initialHeading + Math.PI - (Math.atan(deltaW/deltaH));    //*Math.PI/180;
        computeNewCoordinates();
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 7: "+lat2+", "+long2+", "+headingDeg+" deg");
    }
    else if (deltaW<0 && deltaH>0)
    {
        heading = initialHeading + Math.PI + (Math.atan((-1*deltaW)/deltaH));   //*Math.PI/180;
        computeNewCoordinates();
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 8: "+lat2+", "+long2+", "+headingDeg+" deg");
    }
    else
    {
        heading = initialHeading + 2*Math.PI - (Math.atan(deltaW/deltaH));  //*Math.PI/180;
        computeNewCoordinates();
        headingDeg = heading*180/Math.PI;

        //alert("Case 9: "+lat2+", "+long2+", "+headingDeg+" deg");
    }
}

function computeSelectVerticiesGPSCoord()
{
    pixelDistanceFromCenter();
    computeGPSCoordFromCase();
    storeClickedCoords();
};

function computeProbeDropGPSCoords()
{
    pixelDistanceFromCenter();
    computeGPSCoordFromCase();
    storePDClickedCoords();
}

function computePointTargetGPSCoords()
{
    pixelDistanceFromCenter();
    computeGPSCoordFromCase();
    storePTClickedCoords(); 
}

/*************************************************************************************************

            Computes the distance between two GPS Coordinates

*************************************************************************************************/
function distBetweenPoints()
{   
    while (counter1<=GPSClickedCoords.length-2)
    {

        if (counter1==GPSClickedCoords.length-2)
        {
            a = Math.pow(Math.sin((GPSClickedCoords[GPSClickedCoords.length-2]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[GPSClickedCoords.length-2])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[GPSClickedCoords.length-1]-GPSClickedCoords[1])/2,2);
            c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
            //alert("case 1");
        }
    
        else
        {
            a = Math.pow(Math.sin((GPSClickedCoords[counter1+2]-GPSClickedCoords[counter1])/2),2)+Math.cos(GPSClickedCoords[counter1])*Math.cos(GPSClickedCoords[counter1+2])*Math.pow(Math.sin(GPSClickedCoords[counter2+2]-GPSClickedCoords[counter2])/2,2);
            c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
            //alert("case 2");
        }

        groundDistBetweenPoints[counter3]=R*c*1000; // converted to m
    
        counter1+=2;
        counter2+=2;
        counter3+=1;
    }

    //alert("Distance is "+groundDistBetweenPoints);
}

/*************************************************************************************************

            Computes additional distances needed for calculating area

*************************************************************************************************/
function computeExtraDistances()
{
    checkLength=GPSClickedCoords.length/2;
    index_dist=GPSClickedCoords.length/2;

    if(checkLength==3)
    {}
    else
    {
        for(var i=0;i<(checkLength-3);i++)
        {
            a = Math.pow(Math.sin((GPSClickedCoords[latCoordIndex]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[latCoordIndex])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[latCoordIndex+1]-GPSClickedCoords[1])/2,2);
            c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
            groundDistBetweenPoints[index_dist]=R*c*1000;

            //alert("Extra length: "+groundDistBetweenPoints[index_dist]);
            //alert("index is: "+latCoordIndex);

            latCoordIndex=latCoordIndex+2;
            index_dist++;
        }
    }
}
/*************************************************************************************************

                Function for Computing the Area of the Target

*************************************************************************************************/
// Master function to check which shape the area is based on number of clicks
function calculateArea()
{
    if(groundDistBetweenPoints.length==3)
    {
        alert("triangle case");
        triangleArea();
    }
    else if(groundDistBetweenPoints.length==4)
    {
        alert("4 Sided figure case")
        squareArea();
    }
    else if(groundDistBetweenPoints.length==5)
    {
        alert("pentagon case");
        pentagonArea();
    }
    else if(groundDistBetweenPoints.length==6)
    {
        alert("hexagon case");
        hexagonArea();
    }
    else if(groundDistBetweenPoints.length==7)
    {
        alert("heptagon case");
        heptagonArea();
    }
    else if(groundDistBetweenPoints.length==8)
    {
        alert("octagon case");
        octagonArea();
    }
    alert("Area is "+AreaTotal);
}

// Component functions for calculating the area of each shape

function triangleArea()
{
    s[1]=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[2])/2;
    AreaTotal=Math.sqrt(s[1]*(s[1]-groundDistBetweenPoints[0])*(s[1]-groundDistBetweenPoints[1])*(s[1]-groundDistBetweenPoints[2]));

}

function squareArea()
{
    computeExtraDistances();

    s[1]=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[4])/2;
    A[1]=Math.sqrt(s[1]*(s[1]-groundDistBetweenPoints[0])*(s[1]-groundDistBetweenPoints[1])*(s[1]-groundDistBetweenPoints[4]));
    //alert("Area of first triangle "+A1);

    s[2]=(groundDistBetweenPoints[2]+groundDistBetweenPoints[3]+groundDistBetweenPoints[4])/2;
    A[2]=Math.sqrt(s[2]*(s[2]-groundDistBetweenPoints[2])*(s[2]-groundDistBetweenPoints[3])*(s[2]-groundDistBetweenPoints[4]));
    //alert("Area of second triangle "+A2);

    AreaTotal = A.reduce(function(pv, cv) { return pv + cv; }, 0);
}

function pentagonArea()
{
    computeExtraDistances();

    s[1]=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[5])/2;
    A[1]=Math.sqrt(s[1]*(s[1]-groundDistBetweenPoints[0])*(s[1]-groundDistBetweenPoints[1])*(s[1]-groundDistBetweenPoints[5]));
    //alert("Area of first triangle "+A1);
    
    areaCalcCase2();

    s[3]=(groundDistBetweenPoints[3]+groundDistBetweenPoints[4]+groundDistBetweenPoints[6])/2;
    A[3]=Math.sqrt(s[3]*(s[3]-groundDistBetweenPoints[3])*(s[3]-groundDistBetweenPoints[4])*(s[3]-groundDistBetweenPoints[6]));
    //alert("Area of third triangle "+A3);

    AreaTotal = A.reduce(function(pv, cv) { return pv + cv; }, 0);    
}

function hexagonArea() // yields same area as hexagonArea1
{
    computeExtraDistances();

    s[1]=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[6])/2;
    A[1]=Math.sqrt(s[1]*(s[1]-groundDistBetweenPoints[0])*(s[1]-groundDistBetweenPoints[1])*(s[1]-groundDistBetweenPoints[6]));
    //alert("Area of first triangle "+A1);

    areaCalcCase2();

    s[4]=(groundDistBetweenPoints[4]+groundDistBetweenPoints[5]+groundDistBetweenPoints[8])/2;
    A[4]=Math.sqrt(s[4]*(s[4]-groundDistBetweenPoints[4])*(s[4]-groundDistBetweenPoints[5])*(s[4]-groundDistBetweenPoints[8]));
    //alert("Area of fourth triangle "+A44);

    AreaTotal = A.reduce(function(pv, cv) { return pv + cv; }, 0);
}

function heptagonArea()
{
    computeExtraDistances();

    s[1]=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[7])/2;
    A[1]=Math.sqrt(s[1]*(s[1]-groundDistBetweenPoints[0])*(s[1]-groundDistBetweenPoints[1])*(s[1]-groundDistBetweenPoints[7]));
    //alert("Area of first triangle "+A1);
   
    areaCalcCase2();

    s[5]=(groundDistBetweenPoints[5]+groundDistBetweenPoints[6]+groundDistBetweenPoints[10])/2;
    A[5]=Math.sqrt(s[5]*(s[5]-groundDistBetweenPoints[5])*(s[5]-groundDistBetweenPoints[6])*(s[5]-groundDistBetweenPoints[10]));
    //alert("Area of fifth triangle "+A5);

    AreaTotal = A.reduce(function(pv, cv) { return pv + cv; }, 0);
}

function octagonArea()
{
    computeExtraDistances();

    s[1]=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[8])/2;
    A[1]=Math.sqrt(s[1]*(s[1]-groundDistBetweenPoints[0])*(s[1]-groundDistBetweenPoints[1])*(s[1]-groundDistBetweenPoints[8]));
    //alert("Area of first triangle "+A1);
    
    areaCalcCase2(); 

    s[6]=(groundDistBetweenPoints[6]+groundDistBetweenPoints[7]+groundDistBetweenPoints[12])/2;
    A[6]=Math.sqrt(s[6]*(s[6]-groundDistBetweenPoints[6])*(s[6]-groundDistBetweenPoints[7])*(s[6]-groundDistBetweenPoints[12]));
    //alert("Area of sixth triangle "+A6);

    AreaTotal = A.reduce(function(pv, cv) { return pv + cv; }, 0);
}


function areaCalcCase2()
{
    numIterations;
    dist_counter=2;
    count_componentTriangles=0;
    numPoints=GPSClickedCoords.length/2;
    
    if(numPoints==3 || numPoints==4) {}

    else
    {
        numIterations=numPoints-4;
    }
    
    while(count_componentTriangles<numIterations)
        {
            s[dist_counter]=(groundDistBetweenPoints[dist_counter]+groundDistBetweenPoints[numPoints]+groundDistBetweenPoints[numPoints+1])/2;
            A[dist_counter]=Math.sqrt(s[dist_counter]*(s[dist_counter]-groundDistBetweenPoints[dist_counter])*(s[dist_counter]-groundDistBetweenPoints[numPoints])*(s[dist_counter]-groundDistBetweenPoints[numPoints+1]));
                        
            dist_counter++;
            numPoints++;
            count_componentTriangles++;
        }
}
/*************************************************************************************************

                Function for calculating the centroid of selected target area

*************************************************************************************************/
function calculateCentroidCoords()
{
    while(p<GPSClickedCoords.length)
    {
        sumLat+=GPSClickedCoords[p];
        p++;
        sumLong+=GPSClickedCoords[p];
        p++;
    }

    centroidLat=sumLat/(GPSClickedCoords.length/2);//*180/Math.PI; // convert to deg
    centroidLong=sumLong/(GPSClickedCoords.length/2);//*180/Math.PI; // convert to deg
    alert(centroidLat+", "+centroidLong);
}