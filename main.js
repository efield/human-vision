// Requires
var fs = require("fs"); // Filesystem
var ExifImage = require("exif").ExifImage; // Metadata Read

// Array Declarations and Array Counters
var coordinates = new Array(); // Stores pixel coordinates of clicked point in the form of coordinates[0]=PT1Width coordinates[1]=PT1Height ...
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
var timestamp; // "1:53:47"
var lat1; // = 50*Math.PI/180;
var long1; // = -90*Math.PI/180;
var altitude; // = 0.1 //km
var initialHeading; // = 0; // rad 0==N 90==E 180==S 270==W

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

// For metadata read from .csv file
var address4; // Address for first text file corresponding to loaded image
var imageData = new Array(); // Stores metadata read from file

//************************************************************************************************

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
};    

// Loads newest image from folder into the canvas
document.getElementById("Load").onclick = function loadNewImage() 
    {
        // resets counter for selected verticies and removes any previous drawings on layer2
        counter=0;
        coordinates = [];
        masterData =[];
        masterCounter=1;
        timestamp=0;

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, layer2.width, layer2.height);

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
                     //console.log(exifData); // Displays all EXIF metadata for the image
                     console.log(exifData.makernote); // displays text attached to image ie. alititude,latitiude etc...
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

// Enables the double click action to select verticies of a target
document.getElementById("SelectVerticies").onclick = function SelectVerticies()
    {
        coordinates[counter]=document.addEventListener("dblclick", getClick, false);
    };

// Removes all drawings done on layer2
document.getElementById("Clear").onclick = function clearLayer()
    {
        counter=0;
        coordinates = [];
        GPSClickedCoords=[];
        coordsCount=0;

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, layer2.width, layer2.height);
    }

// Connects the selected verticies and does necessary calculations. Works for shapes with up to 8 verticies
document.getElementById("Compute").onclick = function Compute()
    {
        if(coordinates.length/2<=8) // Triangle
            {    
                connectClickedPoints();
            }
    };

// Obtains XY coordinates of the click on the canvas image and places a red square on layer2 on the location of the click
function getClick(e)
    {
   
        if (counter>=16)
            {
                counter++;
                document.removeEventListener("dblclick",getClick,false);
                alert("removed click listener");
            }

        if (counter<16)
        {
            var rect = document.getElementById("myCanvas").getBoundingClientRect();
            var x= e.clientX - rect.left;
            var y= e.clientY - rect.top;
        
            coordinates[counter]=x; //all even numbered values ie 0,2,4 are x coordinates
            pixelW2=x;// need to make into an array to store all of the GPS data and headings
            counter+=1;

            coordinates[counter]=y; // all odd numbered values ie 1,3,5 are y coordinates
            pixelH2=y; // need to put into the array to store all the GPS data and headings
            counter++;

            getGPSCoord(); // calls function to calculate GPS coordinate of each click

            var c = document.getElementById("layer2");
            var ctx = c.getContext("2d");
            ctx.beginPath();
            ctx.fillStyle="#ff0000";
            ctx.fillRect(x,y,7,7);
            ctx.stroke();
        }
        console.log(coordinates);
    };

function metadata2Variables()
{
    lat1=imageData[0]*Math.PI/180; // converts deg to rad
    long1=imageData[1]*Math.PI/180; // converts deg to rad
    altitude=imageData[2]; // recieves in meters
    initialHeading=imageData[3]*Math.PI/180; // converts deg to rad
    timestamp=imageData[4];
}

function pixelDistanceFromCenter()
{
    
    deltaW= altitude*Math.tan((pixelW2-centerPixelWidth)*pixelWRad); // km
    deltaH= altitude*Math.tan((pixelH2-centerPixelHeight)*pixelHRad); // km
    distance= Math.sqrt(deltaW*deltaW+deltaH*deltaH); // km
    //alert(distance+"km");
};

function computeNewCoordinates(lat1,long1,distance,R,heading)
{
    lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(heading)))*180/Math.PI;
    long2 = (long1 + Math.atan2(Math.sin(heading)*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat2)))*180/Math.PI;
};

function storeClickedCoords()
{
    GPSClickedCoords[coordsCount]=lat2;
    coordsCount+=1;

    GPSClickedCoords[coordsCount]=long2;
    coordsCount++;

    console.log(GPSClickedCoords);
}

function getGPSCoord()
{
    pixelDistanceFromCenter();

    if (deltaW==0 && deltaH==0)
    {
        heading = initialHeading*180/Math.PI;
        lat2 = lat1*180/Math.PI;
        long2 = long1*180/Math.PI;
        
        alert("Case 1: "+lat2+", "+long2+", "+heading+"deg");
        
        storeClickedCoords();
    }
    else if (deltaW==0 && deltaH<0)
    {
        //long2=long1
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(initialHeading)))*180/Math.PI;
        long2 = long1*180/Math.PI;
        heading = initialHeading*180/Math.PI;
        
        alert("Case 2: "+lat2+", "+long2+", "+heading+"deg");
        
        storeClickedCoords();
    }
    else if (deltaW==0 && deltaH>0)
    {
        //long2=long1
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(initialHeading+Math.PI)))*180/Math.PI;
        long2=long1*180/Math.PI;
        heading = (initialHeading+Math.PI)*180/Math.PI;

        alert("Case 3: "+lat2+", "+long2+", "+heading+"deg");

        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH==0)
    {
        //lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(initialHeading+(Math.PI/2))*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat1)))*180/Math.PI;
        lat2 = lat1*180/Math.PI;
        heading=(initialHeading+Math.PI/2)*180/Math.PI;
        
        alert("Case 4: "+lat2+", "+long2+", "+heading+"deg");

        storeClickedCoords();  
    }
    else if (deltaW<0 && deltaH==0)
    {
        //lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(initialHeading+(3*Math.PI/2))*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat1)))*180/Math.PI;
        lat2 = lat1*180/Math.PI;
        heading = (initialHeading+3*Math.PI/2)*180/Math.PI;

        alert("Case 5: "+lat2+", "+long2+", "+heading+"deg");

        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH<0)
    {   
        heading = initialHeading + (Math.atan(deltaW/(-1*deltaH))); //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert("Case 6: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH>0)
    {
        heading = initialHeading + Math.PI - (Math.atan(deltaW/deltaH));    //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert("Case 7: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW<0 && deltaH>0)
    {
        heading = initialHeading + Math.PI + (Math.atan((-1*deltaW)/deltaH));   //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert("Case 8: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else
    {
        heading = initialHeading + 2*Math.PI - (Math.atan(deltaW/deltaH));  //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert("Case 9: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
};

function data2Master()
{
    masterData[0]=timestamp;

    masterCounter=1;

    for(var i=0;i<GPSClickedCoords.length;i++)
    {
        masterData[masterCounter]=GPSClickedCoords[i];
        masterCounter++;
    }

    console.log(masterData);
    write2DataLog(); // not showing second timestamp
}

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

// function write2DataLog()
// {
//     fs.writeFile("C:/Users/Eric/human-vision/DataLogs/Log.txt", masterData, function(err) 
//         {  
//             if (err) throw err;
//             alert("Saved");
//         }
// )};