// Requires
var fs = require("fs"); // Filesystem
var ExifImage = require("exif").ExifImage; // Metadata Read
var os = require('os'); // For reading line breaks

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

// Variables for calculating the distance between two GPS locations (Haversine Function)
var a; // First part of Haversine Function
var c; // Second part of Haversine Function
var counter1=0; // Latitude index counter (even numbers)
var counter2=1; // Longitude index counter (odd numbers)

var groundDistBetweenPoints = new Array(); // Stores the calculated length between two GPS coordinates in meters
var counter3=0; // counter for array groundDistBetweenPoints

// Variables for calculating the shape area (Heron's Function)
var s1; // Semiperimeter triangle 1
var s2; // Semiperimeter triangle 2
var s3; // Semiperimeter triangle 3
var s4; // Semiperimeter triangle 4
var s5; // Semiperimeter triangle 5
var s6; // Semiperimeter triangle 6

var A; // Total area of shape in m^2
var A1; // Area of triangle 1
var A2; // Area of triangle 2
var A3; // Area of triangle 3
var A4; // Area of triangle 4
var A5; // Area of triangle 5
var A6; // Area of triangle 6

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
        sum1=0;
        sum2=0;

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
        groundDistBetweenPoints=[];
        counter1=0;
        counter2=1;
        counter3=0;

        var centroidLat=0;
        var centroidLong=0;
        var p=0;
        var sum1=0;
        var sum2=0;

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
                distBetweenPoints();
                calculateArea();

                calculateCentroidCoords();
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
    lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(heading)));//*180/Math.PI;
    long2 = (long1 + Math.atan2(Math.sin(heading)*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat2)));//*180/Math.PI;
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
        lat2 = lat1;//*180/Math.PI;
        long2 = long1;//*180/Math.PI;
        
        //alert("Case 1: "+lat2+", "+long2+", "+heading+"deg");
        
        storeClickedCoords();
    }
    else if (deltaW==0 && deltaH<0)
    {
        //long2=long1
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(initialHeading)));//*180/Math.PI;
        long2 = long1;//*180/Math.PI;
        heading = initialHeading*180/Math.PI;
        
        //alert("Case 2: "+lat2+", "+long2+", "+heading+"deg");
        
        storeClickedCoords();
    }
    else if (deltaW==0 && deltaH>0)
    {
        //long2=long1
        lat2= (Math.asin(Math.sin(lat1)*Math.cos(distance/R) + Math.cos(lat1)*Math.sin(distance/R)*Math.cos(initialHeading+Math.PI)));//*180/Math.PI;
        long2=long1;//*180/Math.PI;
        heading = (initialHeading+Math.PI)*180/Math.PI;

        //alert("Case 3: "+lat2+", "+long2+", "+heading+"deg");

        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH==0)
    {
        //lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(initialHeading+(Math.PI/2))*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat1)));//*180/Math.PI;
        lat2 = lat1;//*180/Math.PI;
        heading=(initialHeading+Math.PI/2)*180/Math.PI;
        
        //alert("Case 4: "+lat2+", "+long2+", "+heading+"deg");

        storeClickedCoords();  
    }
    else if (deltaW<0 && deltaH==0)
    {
        //lat2=lat1;
        long2 = (long1 + Math.atan2(Math.sin(initialHeading+(3*Math.PI/2))*Math.sin(distance/R)*Math.cos(lat1), Math.cos(distance/R)-Math.sin(lat1)*Math.sin(lat1)));//*180/Math.PI;
        lat2 = lat1;//*180/Math.PI;
        heading = (initialHeading+3*Math.PI/2)*180/Math.PI;

        //alert("Case 5: "+lat2+", "+long2+", "+heading+"deg");

        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH<0)
    {   
        heading = initialHeading + (Math.atan(deltaW/(-1*deltaH))); //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 6: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW>0 && deltaH>0)
    {
        heading = initialHeading + Math.PI - (Math.atan(deltaW/deltaH));    //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 7: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else if (deltaW<0 && deltaH>0)
    {
        heading = initialHeading + Math.PI + (Math.atan((-1*deltaW)/deltaH));   //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 8: "+lat2+", "+long2+", "+headingDeg+" deg");
        
        storeClickedCoords();
    }
    else
    {
        heading = initialHeading + 2*Math.PI - (Math.atan(deltaW/deltaH));  //*Math.PI/180;
        computeNewCoordinates(lat1,long1,distance,R,heading);
        headingDeg = heading*180/Math.PI;
        
        //alert("Case 9: "+lat2+", "+long2+", "+headingDeg+" deg");
        
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

function write2DataLog()
{
    fs.appendFile("C:/Users/Eric/human-vision/DataLogs/Log.txt", masterData +"\r\n", function(err) // \r\n is a line break
        {  
            if (err) throw err;
        }
)};

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
    alert("Area is "+A);
}

function triangleArea()
{
    s1=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[2])/2;
    A=Math.sqrt(s1*(s1-groundDistBetweenPoints[0])*(s1-groundDistBetweenPoints[1])*(s1-groundDistBetweenPoints[2]));
}

function squareArea()
{
    squareExtraDistances();

    s1=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[4])/2;
    A1=Math.sqrt(s1*(s1-groundDistBetweenPoints[0])*(s1-groundDistBetweenPoints[1])*(s1-groundDistBetweenPoints[4]));
    //alert("Area of first triangle "+A1);

    s2=(groundDistBetweenPoints[2]+groundDistBetweenPoints[3]+groundDistBetweenPoints[4])/2;
    A2=Math.sqrt(s2*(s2-groundDistBetweenPoints[2])*(s2-groundDistBetweenPoints[3])*(s2-groundDistBetweenPoints[4]));
    //alert("Area of second triangle "+A2);

    A=A1+A2;
} 

function pentagonArea()
{
    pentagonExtraDistances();

    s1=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[5])/2;
    A1=Math.sqrt(s1*(s1-groundDistBetweenPoints[0])*(s1-groundDistBetweenPoints[1])*(s1-groundDistBetweenPoints[5]));
    //alert("Area of first triangle "+A1);

    s2=(groundDistBetweenPoints[2]+groundDistBetweenPoints[5]+groundDistBetweenPoints[6])/2;
    A2=Math.sqrt(s2*(s2-groundDistBetweenPoints[2])*(s2-groundDistBetweenPoints[5])*(s2-groundDistBetweenPoints[6]));
    //alert("Area of second triangle "+A2)

    s3=(groundDistBetweenPoints[3]+groundDistBetweenPoints[4]+groundDistBetweenPoints[6])/2;
    A3=Math.sqrt(s3*(s3-groundDistBetweenPoints[3])*(s3-groundDistBetweenPoints[4])*(s3-groundDistBetweenPoints[6]));
    //alert("Area of third triangle "+A3);

    A=A1+A2+A3;
}

function hexagonArea()
{
    hexagonExtraDistances();

    s1=(groundDistBetweenPoints[0]+groundDistBetweenPoints[1]+groundDistBetweenPoints[6])/2;
    A1=Math.sqrt(s1*(s1-groundDistBetweenPoints[0])*(s1-groundDistBetweenPoints[1])*(s1-groundDistBetweenPoints[6]));
    //alert("Area of first triangle "+A1);

    s2=(groundDistBetweenPoints[3]+groundDistBetweenPoints[4]+groundDistBetweenPoints[7])/2;
    A2=Math.sqrt(s2*(s2-groundDistBetweenPoints[3])*(s2-groundDistBetweenPoints[4])*(s2-groundDistBetweenPoints[7]));
    //alert("Area of second triangle "+A2);

    s3=(groundDistBetweenPoints[5]+groundDistBetweenPoints[7]+groundDistBetweenPoints[8])/2;
    A3=Math.sqrt(s3*(s3-groundDistBetweenPoints[5])*(s3-groundDistBetweenPoints[7])*(s3-groundDistBetweenPoints[8]));
    //alert("Area of third triangle "+A3);

    s4=(groundDistBetweenPoints[2]+groundDistBetweenPoints[6]+groundDistBetweenPoints[8])/2;
    A4=Math.sqrt(s4*(s4-groundDistBetweenPoints[2])*(s4-groundDistBetweenPoints[6])*(s4-groundDistBetweenPoints[8]));
    //alert("Area of fourth triangle "+A4);

    A=A1+A2+A3+A4;
}

function heptagonArea()
{
    heptagonExtraDistances();

    s1=(groundDistBetweenPoints[1]+groundDistBetweenPoints[2]+groundDistBetweenPoints[7])/2;
    A1=Math.sqrt(s1*(s1-groundDistBetweenPoints[1])*(s1-groundDistBetweenPoints[2])*(s1-groundDistBetweenPoints[7]));
    //alert("Area of first triangle "+A1);

    s2=(groundDistBetweenPoints[4]+groundDistBetweenPoints[5]+groundDistBetweenPoints[8])/2;
    A2=Math.sqrt(s2*(s2-groundDistBetweenPoints[4])*(s2-groundDistBetweenPoints[5])*(s2-groundDistBetweenPoints[8]));
    //alert("Area of second triangle "+A2);

    s3=(groundDistBetweenPoints[0]+groundDistBetweenPoints[7]+groundDistBetweenPoints[9])/2;
    A3=Math.sqrt(s3*(s3-groundDistBetweenPoints[0])*(s3-groundDistBetweenPoints[7])*(s3-groundDistBetweenPoints[9]));
    //alert("Area of third triangle "+A3);

    s4=(groundDistBetweenPoints[6]+groundDistBetweenPoints[8]+groundDistBetweenPoints[10])/2;
    A4=Math.sqrt(s4*(s4-groundDistBetweenPoints[6])*(s4-groundDistBetweenPoints[8])*(s4-groundDistBetweenPoints[10]));
    //alert("Area of fourth triangle "+A4);

    s5=(groundDistBetweenPoints[3]+groundDistBetweenPoints[9]+groundDistBetweenPoints[10])/2;
    A5=Math.sqrt(s5*(s5-groundDistBetweenPoints[3])*(s5-groundDistBetweenPoints[9])*(s5-groundDistBetweenPoints[10]));
    //alert("Area of fifth triangle "+A5);

    A=A1+A2+A3+A4+A5;
}

function octagonArea()
{
    octagonExtraDistances();

    s1=(groundDistBetweenPoints[1]+groundDistBetweenPoints[2]+groundDistBetweenPoints[10])/2;
    A1=Math.sqrt(s1*(s1-groundDistBetweenPoints[1])*(s1-groundDistBetweenPoints[2])*(s1-groundDistBetweenPoints[10]));
    //alert("Area of first triangle "+A1);

    s2=(groundDistBetweenPoints[4]+groundDistBetweenPoints[5]+groundDistBetweenPoints[11])/2;
    A2=Math.sqrt(s2*(s2-groundDistBetweenPoints[4])*(s2-groundDistBetweenPoints[5])*(s2-groundDistBetweenPoints[11]));
    //alert("Area of second triangle "+A2);

    s3=(groundDistBetweenPoints[0]+groundDistBetweenPoints[8]+groundDistBetweenPoints[10])/2;
    A3=Math.sqrt(s3*(s3-groundDistBetweenPoints[0])*(s3-groundDistBetweenPoints[8])*(s3-groundDistBetweenPoints[10]));
    //alert("Area of third triangle "+A3);

    s4=(groundDistBetweenPoints[6]+groundDistBetweenPoints[9]+groundDistBetweenPoints[11])/2;
    A4=Math.sqrt(s4*(s4-groundDistBetweenPoints[6])*(s4-groundDistBetweenPoints[9])*(s4-groundDistBetweenPoints[11]));
    //alert("Area of fourth triangle "+A4);

    s5=(groundDistBetweenPoints[3]+groundDistBetweenPoints[8]+groundDistBetweenPoints[12])/2;
    A5=Math.sqrt(s5*(s5-groundDistBetweenPoints[3])*(s5-groundDistBetweenPoints[8])*(s5-groundDistBetweenPoints[12]));
    //alert("Area of fifth triangle "+A5);

    s6=(groundDistBetweenPoints[7]+groundDistBetweenPoints[9]+groundDistBetweenPoints[12])/2;
    A6=Math.sqrt(s6*(s6-groundDistBetweenPoints[7])*(s6-groundDistBetweenPoints[9])*(s6-groundDistBetweenPoints[12]));
    //alert("Area of sixth triangle "+A6);

    A=A1+A2+A3+A4+A5+A6;
}

function squareExtraDistances()
{
    a = Math.pow(Math.sin((GPSClickedCoords[4]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[4])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[5]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[4]=R*c*1000;
    //alert("Extra length: "+groundDistBetweenPoints[4]);
}

function pentagonExtraDistances()
{
    a = Math.pow(Math.sin((GPSClickedCoords[4]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[4])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[5]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[5]=R*c*1000;
    //alert("First extra length: "+groundDistBetweenPoints[5]);

    a = Math.pow(Math.sin((GPSClickedCoords[6]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[6])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[7]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[6]=R*c*1000;
    //alert("Second extra length: "+groundDistBetweenPoints[6]);
}

function hexagonExtraDistances()
{
    a = Math.pow(Math.sin((GPSClickedCoords[4]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[4])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[5]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[6]=R*c*1000;
    //alert("First extra length: "+groundDistBetweenPoints[6]);

    a = Math.pow(Math.sin((GPSClickedCoords[10]-GPSClickedCoords[6])/2),2)+Math.cos(GPSClickedCoords[10])*Math.cos(GPSClickedCoords[6])*Math.pow(Math.sin(GPSClickedCoords[11]-GPSClickedCoords[7])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[7]=R*c*1000;
    //alert("Second extra length: "+groundDistBetweenPoints[7]);

    a = Math.pow(Math.sin((GPSClickedCoords[6]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[6])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[7]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[8]=R*c*1000;
    //alert("Third extra length: "+groundDistBetweenPoints[8]);
}

function heptagonExtraDistances()
{
    a = Math.pow(Math.sin((GPSClickedCoords[6]-GPSClickedCoords[2])/2),2)+Math.cos(GPSClickedCoords[6])*Math.cos(GPSClickedCoords[2])*Math.pow(Math.sin(GPSClickedCoords[7]-GPSClickedCoords[3])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[7]=R*c*1000;
    //alert("First extra length: "+groundDistBetweenPoints[7]);

    a = Math.pow(Math.sin((GPSClickedCoords[12]-GPSClickedCoords[8])/2),2)+Math.cos(GPSClickedCoords[12])*Math.cos(GPSClickedCoords[8])*Math.pow(Math.sin(GPSClickedCoords[13]-GPSClickedCoords[9])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[8]=R*c*1000;
    //alert("Second extra length: "+groundDistBetweenPoints[8]);

    a = Math.pow(Math.sin((GPSClickedCoords[6]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[6])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[7]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[9]=R*c*1000;
    //alert("Third extra length: "+groundDistBetweenPoints[9]);

    a = Math.pow(Math.sin((GPSClickedCoords[8]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[8])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[9]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[10]=R*c*1000;
    //alert("Fourth extra length: "+groundDistBetweenPoints[10]);
}

function octagonExtraDistances()
{
    a = Math.pow(Math.sin((GPSClickedCoords[6]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[6])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[7]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[8]=R*c*1000;
    //alert("First extra length: "+groundDistBetweenPoints[8]);

    a = Math.pow(Math.sin((GPSClickedCoords[14]-GPSClickedCoords[8])/2),2)+Math.cos(GPSClickedCoords[14])*Math.cos(GPSClickedCoords[8])*Math.pow(Math.sin(GPSClickedCoords[15]-GPSClickedCoords[9])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[9]=R*c*1000;
    //alert("Second extra length: "+groundDistBetweenPoints[9]);

    a = Math.pow(Math.sin((GPSClickedCoords[6]-GPSClickedCoords[2])/2),2)+Math.cos(GPSClickedCoords[6])*Math.cos(GPSClickedCoords[2])*Math.pow(Math.sin(GPSClickedCoords[7]-GPSClickedCoords[3])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[10]=R*c*1000;
    // alert("Third extra length: "+groundDistBetweenPoints[10]);

    a = Math.pow(Math.sin((GPSClickedCoords[12]-GPSClickedCoords[8])/2),2)+Math.cos(GPSClickedCoords[12])*Math.cos(GPSClickedCoords[8])*Math.pow(Math.sin(GPSClickedCoords[13]-GPSClickedCoords[9])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[11]=R*c*1000;
    //alert("Fourth extra length: "+groundDistBetweenPoints[11]);

    a = Math.pow(Math.sin((GPSClickedCoords[8]-GPSClickedCoords[0])/2),2)+Math.cos(GPSClickedCoords[8])*Math.cos(GPSClickedCoords[0])*Math.pow(Math.sin(GPSClickedCoords[9]-GPSClickedCoords[1])/2,2);
    c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    groundDistBetweenPoints[12]=R*c*1000;
    //alert("Fifth extra length: "+groundDistBetweenPoints[12]);
}

var centroidLat=0;
var centroidLong=0;
var p=0;
var sum1=0;
var sum2=0;

function calculateCentroidCoords()
{
   // if(GPSClickedCoords.length/2==3)
   // {
        while(p<GPSClickedCoords.length)
        {
        // centroidLat=((GPSClickedCoords[p]+GPSClickedCoords[p+2]+GPSClickedCoords[p+4])/(GPSClickedCoords.length/2))*180/Math.PI;
        // alert(centroidLat);
        // centroidLong=((GPSClickedCoords[p+1]+GPSClickedCoords[p+3]+GPSClickedCoords[p+5])/(GPSClickedCoords.length/2))*180/Math.PI;
        // alert(centroidLong);
        // p+=20;
            sum1+=GPSClickedCoords[p];
            p++;
            sum2+=GPSClickedCoords[p];
            p++;
        }

        centroidLat=sum1/(GPSClickedCoords.length/2);//*180/Math.PI;
        centroidLong=sum2/(GPSClickedCoords.length/2);//*180/Math.PI;
        alert(centroidLat+", "+centroidLong);
   // }
}

// var c = document.getElementById("consoleDisplay");
// var ctx = c.getContext("2d");
// ctx.fillStyle="15px Arial";
// ctx.fillText("hi",10,10);