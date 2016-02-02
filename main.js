//Variable Declarations;
var fs = require("fs");
var NoTarget;
var Load;
var address2;
var newaddress2;
var coordinates = new Array();
var imageData = new Array();
var counter = 0;

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
                ctx.drawImage(img,0,0,1000,625);
                img.style.display = 'none';
            };
        });

        fs.readdir("../human-vision/Metadata", function(err, files4)
        {
            if (err) throw err;
            console.log(files4); // gives an array of file names in folder
            //console.log(files2.length); // displays number of files in the folder

            address4 = "../human-vision/Metadata/" + files4[0];
        // Asynchronous read data from file into an array
        fs.readFile(address4, "UTF-8", function (err, data) {
           if (err) throw err;
           {
            imageData = data.split(","); // removes all "," from the string so "1,2,3" => "1","2","3"
            console.log(imageData);
            }
        });
        });
    };

//If no target is selected the file is moved from the 'To process folder' to the 'Processed folder'
Process = document.getElementById("Process").onclick = function transferProcessed()
    {
        fs.readdir("../human-vision/Images_2_Process", function(err,files3)
        {
            if (err) throw err;
            console.log(files3);
            console.log(files3.length);

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

// Obtains XY coordinates of the click and places a red square on layer2 where clicked
function getClick(e)
    {
   
        if (counter>=10)
            {
                counter++;
                document.removeEventListener("dblclick",getClick,false);
                alert("removed");
            }

        if (counter<10)
        {
            var rect = document.getElementById("myCanvas").getBoundingClientRect();
            var x= e.clientX - rect.left;
            var y= e.clientY - rect.top;
        
            coordinates[counter]=x; //all even numbered values ie 0,2,4 are x coordinates
            counter+=1;
            coordinates[counter]=y; // all odd numbered values ie 1,3,5 are y coordinates
            counter++;

            var c = document.getElementById("layer2");
            var ctx = c.getContext("2d");
            ctx.beginPath();
            ctx.fillStyle="#ff0000";
            ctx.fillRect(x,y,7,7);
            ctx.stroke();
        }
        console.log(coordinates);
    };

// Removes all drawings done on layer2
clear = document.getElementById("Clear").onclick = function clearLayer()
    {
        counter=0;
        coordinates = [];

        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.clearRect(0, 0, layer2.width, layer2.height);
    }

// Connects the selected verticies and does necessary calculations
// works for shapes triangle, square and pentagon (needs to be updated to include up to hexagon)
document.getElementById("Compute").onclick = function Compute()
    {

        var numVerticies = coordinates.length;
        
        var c = document.getElementById("layer2");
        var ctx = c.getContext("2d");
        ctx.beginPath();
    
        if(numVerticies==6) // Triangle
            {    
                ctx.moveTo(coordinates[0],coordinates[1]);
                ctx.lineTo(coordinates[2],coordinates[3]);
                ctx.lineTo(coordinates[4],coordinates[5]);
                ctx.lineTo(coordinates[0],coordinates[1]);
                ctx.stroke();
            }

        if(numVerticies==8) // Square
            {
                ctx.moveTo(coordinates[0],coordinates[1]);
                ctx.lineTo(coordinates[2],coordinates[3]);
                ctx.lineTo(coordinates[4],coordinates[5]);
                ctx.lineTo(coordinates[6],coordinates[7]);
                ctx.lineTo(coordinates[0],coordinates[1]);
                ctx.stroke();
            }

        if(numVerticies==10) // Pentagon
            {
                ctx.moveTo(coordinates[0],coordinates[1]);
                ctx.lineTo(coordinates[2],coordinates[3]);
                ctx.lineTo(coordinates[4],coordinates[5]);
                ctx.lineTo(coordinates[6],coordinates[7]);
                ctx.lineTo(coordinates[8],coordinates[9]);
                ctx.lineTo(coordinates[0],coordinates[1]);
                ctx.stroke();
            }
    };

//Other tesed code snipits

//Works! Writes data to a file or writes data to a new file
/*
fs.writeFile('C:/Users/Eric/human-vision/Images_2_Process/writing.txt', "1,2,3,4,5,6,7,8,9,10,11", function(err) {
  if (err) throw err;
  console.log("Saved");
});
*/

