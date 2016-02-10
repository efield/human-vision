//Variable Declarations
var fs = require("fs");
var ExifImage = require("exif").ExifImage;
var centerPixelWidth = 768;
var centerPixelHeight = 432;
var NoTarget;
var Load;
var address2;
var newaddress2;
var coordinates = new Array();
var imageData = new Array();
var counter = 0;
var GPSClickedCoords = new Array();
var pointsCount =0;
var timestamp;
var masterData = new Array();

// Clicked Pixel Coordinates
var pixelW2;
var pixelH2;

//Variable declarations for GPS computations
var heading;
var headingDeg;
var lat2;
var long2;
var lat2Deg;
var long2Deg;

var deltaW;
var deltaH;
var distance;

// Universal constants
var R = 6371 // km
var pixelWRad = 0.061458*Math.PI/180; // rad comes from Width IFOV calc 94.4/1536
var pixelHRad = 0.063657*Math.PI/180; // rad comes from Height IFOV calc 55/864

// Come from metadata
var lat1; // = 50*Math.PI/180;
var long1; // = -90*Math.PI/180;
var altitude; // = 0.1 //km
var initialHeading; // = 0; // rad 0==N 90==E 180==S 270==W


//************************************************************************************************

//If no target is selected the file is moved from the 'To process folder' to the 'Deleted folder'
NoTarget = document.getElementById("NoTarget").onclick = function transferDeleted() 
{
    fs.readdir("../human-vision/Images_2_Process", function(err,files3)
        {
            if (err) throw err;
            console.log(files3);
            console.log(files3.length);
        
            fs.rename("../human-vision/Images_2_Process/" + files3[0],"../human-vision/Deleted/" + files3[0], function(err) 
                {
                    if (err) throw err;
                    alert("File successfully Deleted");
                })
        })
};    

// Loads newest image from folder into the canvas
Load = document.getElementById("Load").onclick = function loadNewImage() 
    {
    // resets counter for selected verticies and removes any previous drawings on layer2
        counter=0;
        coordinates = [];
        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, layer2.width, layer2.height);

        fs.readdir("../human-vision/Images_2_Process", function(err, files2)
        {
            if (err) throw err;
            console.log(files2); // gives an array of file names in folder
            //console.log(files2.length); // displays number of files in the folder

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

            // Retrives metadata in image

            // new ExifImage({ image : address2 }, function (error, exifData) {
            //     if (error)
            //         console.log("Error: "+error.message);
            //     else
            //         console.log(exifData); // Do something with your data!
            //         console.log(exifData.makernote); // displays data creator attached to image ie. our alititude,latitiude etc...
            //});
        });

        //Reading metadata from .txt files
        fs.readdir("../human-vision/Metadata", function(err, files4)
        {
            if (err) throw err;
            //console.log(files4);           // gives an array of file names in folder
            //console.log(files2.length);   // displays number of files in the folder

            address4 = "../human-vision/Metadata/" + files4[0];
        
        // Asynchronous read data from file into an array
        fs.readFile(address4, "UTF-8", function (err, data) {
           if (err) throw err;
           {
            imageData = data.split(","); // removes all "," from the string so "1,2,3" => "1","2","3"
            //console.log(imageData);

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
            //console.log(files3);
            //console.log(files3.length);

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
        pointsCount=0;

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, layer2.width, layer2.height);
    }

// Connects the selected verticies and does necessary calculations
// works for shapes triangle, square and pentagon (needs to be updated to include up to hexagon)
document.getElementById("Compute").onclick = function Compute()
    {
        if(coordinates.length/2==3) // Triangle
            {    
                connectClickedPoints();
            }

        if(coordinates.length/2==4) // Square
            {
                connectClickedPoints();
            }

        if(coordinates.length/2==5) // Pentagon
            {
                connectClickedPoints();
            }
        if(coordinates.length/2==6) // Hexagon
        {
            connectClickedPoints(); 
        }
    };

function connectClickedPoints()
{
    var c = document.getElementById("layer2");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    var i=2;

    ctx.moveTo(coordinates[0],coordinates[1]);
    while(i<coordinates.length)
    {
        ctx.lineTo(coordinates[i],coordinates[i+=1]);
        i++;
    }
    ctx.lineTo(coordinates[0],coordinates[1]);
    ctx.stroke();
}

function distanceBetweenCoords()
{

}

function data2Master()
{
    masterData[0]=timestamp;

    var masterCounter=1;
    var i;

    for(i=0;i<GPSClickedCoords.length;i++)
    {
        masterData[masterCounter]=GPSClickedCoords[i];
        masterCounter++;
    }

    console.log(masterData);
}

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
    alert("deltaW is "+deltaW+", deltaH is "+deltaH);
    //alert(distance+"km");
};

function storeClickedCoords()
{
    GPSClickedCoords[pointsCount]=lat2;
    pointsCount+=1;
    GPSClickedCoords[pointsCount]=long2;
    pointsCount++;
    console.log(GPSClickedCoords);
}

function computeNewCoordinates(lat1,long1,distance,R,heading)
{
    lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(heading)))*180/Math.PI;
    long2 = (long1 + Math.atan2(Math.sin(heading)*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat2)))*180/Math.PI;
};

function getGPSCoord()
{
    pixelDistanceFromCenter();

    if (deltaW==0 && deltaH==0)
    {
        alert("case 1");

        heading = initialHeading*180/Math.PI;
        lat2 = lat1*180/Math.PI;
        long2 = long1*180/Math.PI;
        
        alert(lat2+", "+long2+", "+heading+"deg");
        
        GPSClickedCoords[pointsCount]=lat2;
        pointsCount+=1;
        GPSClickedCoords[pointsCount]=long2;
        pointsCount++;
    }
    else if (deltaW==0 && deltaH<0)
    {
        alert("case 2");

        heading = initialHeading;
        long2=long1;
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(heading)))*180/Math.PI;
        long2Deg = long2*180/Math.PI;
        heading = heading*180/Math.PI;
        
        alert(lat2+", "+long2Deg+", "+heading+"deg");
        
        GPSClickedCoords[pointsCount]=lat2;
        pointsCount+=1;
        GPSClickedCoords[pointsCount]=long2Deg;
        pointsCount++;
    }
    else if (deltaW==0 && deltaH>0)
    {
        alert("case 3");

        heading = initialHeading + Math.PI;
        long2=long1;
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(heading)))*180/Math.PI;
        long2Deg=long2*180/Math.PI;
        heading = heading*180/Math.PI;

        alert(lat2+", "+long2Deg+", "+heading+"deg");

        GPSClickedCoords[pointsCount]=lat2;
        pointsCount+=1;
        GPSClickedCoords[pointsCount]=long2Deg;
        pointsCount++;
    }
    else if (deltaW>0 && deltaH==0)
    {
        alert("case 4");

        heading = initialHeading + Math.PI/2;
        lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(heading)*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat2)))*180/Math.PI;
        lat2Deg = lat2*180/Math.PI;
        heading=heading*180/Math.PI;
        
        alert(lat2Deg+", "+long2+", "+heading+"deg");

        GPSClickedCoords[pointsCount]=lat2Deg;
        pointsCount+=1;
        GPSClickedCoords[pointsCount]=long2;
        pointsCount++;     
    }
    else if (deltaW<0 && deltaH==0)
    {
        alert("case 5");

        heading = initialHeading + 3*Math.PI/2;
        lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(heading)*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat2)))*180/Math.PI;
        lat2Deg = lat2*180/Math.PI;
        heading = heading*180/Math.PI;

        alert(lat2Deg+", "+long2+", "+heading+"deg");

        GPSClickedCoords[pointsCount]=lat2Deg;
        pointsCount+=1;
        GPSClickedCoords[pointsCount]=long2;
        pointsCount++;
    }
    else if (deltaW>0 && deltaH<0)
    {   
        alert("case 6");

        heading = initialHeading + (Math.atan(deltaW/(-1*deltaH))); //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert(lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH>0)
    {
        alert("case 7");

        heading = initialHeading + Math.PI - (Math.atan(deltaW/deltaH));    //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert(lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW<0 && deltaH>0)
    {
        alert("case 8");

        heading = initialHeading + Math.PI + (Math.atan((-1*deltaW)/deltaH));   //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert(lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW<0 && deltaH<0)
    {
        alert("case 9");

        heading = initialHeading + 2*Math.PI - (Math.atan(deltaW/deltaH));  //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        alert(lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
};

// Obtains XY coordinates of the click on the canvas image and places a red square on layer2 on the location of the click

function getClick(e)
    {
   
        if (counter>=12)
            {
                counter++;
                document.removeEventListener("dblclick",getClick,false);
                alert("removed click listener");
            }

        if (counter<10)
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





//Other tesed code snipits

//Works! Writes data to a file or writes data to a new file
/*
fs.writeFile('C:/Users/Eric/human-vision/Images_2_Process/writing.txt', "1,2,3,4,5,6,7,8,9,10,11", function(err) {
  if (err) throw err;
  console.log("Saved");
});
*/