var fs = require("fs");
var NoTarget;
var Load;
var address2;
var newaddress2;

//If no target is selected the file is moved from the 'To process folder' to the 'Deleted folder'
NoTarget = document.getElementById("NoTarget");
NoTarget.onclick = function transferDeleted() {
fs.readdir("C:/Users/Eric/human-vision/Images_2_Process", function(err,files3) {
    if (err) throw err;
    console.log(files3);
    console.log(files3.length);

fs.rename("C:/Users/Eric/human-vision/Images_2_Process/" + files3[0],"C:/Users/Eric/human-vision/Deleted/" + files3[0], function(err) {
    if (err) throw err;
        alert("File successfully Deleted");
    })})};    


// New image is loaded into the GUI
Load = document.getElementById("Load");
Load.onclick = function loadNewImage() {

fs.readdir("C:/Users/Eric/human-vision/Images_2_Process", function(err, files2) {
    if (err) throw err;
    console.log(files2); // gives an array of file names in folder
    console.log(files2.length); // displays number of files in the folder
   // console.log(files2[0]); // displays name of individual file (starts counting at 0)

address2 = "C:/Users/Eric/human-vision/Images_2_Process/" + files2[0];
newaddress2 = "C:/Users/Eric/human-vision/Processed_Images/" + files2[0];

//document.getElementById("image").innerHTML = "<img src='" +address2+ "'>";
   var img = new Image();
img.src = address2;
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

img.onload = function() {
  ctx.drawImage(img,0,0,1000,625);
  img.style.display = 'none';
};
})};

//If no target is selected the file is moved from the 'To process folder' to the 'Processed folder'
Process = document.getElementById("Process");
Process.onclick = function transferProcessed() {
fs.readdir("C:/Users/Eric/human-vision/Images_2_Process", function(err,files3) {
    if (err) throw err;
    console.log(files3);
    console.log(files3.length);

fs.rename("C:/Users/Eric/human-vision/Images_2_Process/" + files3[0],"C:/Users/Eric/human-vision/Processed_Images/" + files3[0], function(err) {
    if (err) throw err;
        alert("File successfully Processed");
    })})};

var coordinates = new Array();
var counter = 0;
document.getElementById("SelectVerticies").onclick = function SelectVerticies() {
    coordinates[counter]=document.addEventListener("dblclick", getClick, false);
};
function getClick(e) {
   
      if (counter>=2)
    {
        counter++;
        document.removeEventListener("dblclick",getClick,false);
        alert("removed");
    }

    if (counter<2) {

    var rect = document.getElementById("myCanvas").getBoundingClientRect();
        var x= e.clientX - rect.left;
        var y= e.clientY - rect.top;
        var c = document.getElementById("layer2");
     var ctx = c.getContext("2d");
     ctx.beginPath();
     ctx.fillStyle="#ff0000";
     ctx.fillRect(x,y,7,7);
     ctx.stroke();
     coordinates[counter]=(x+","+y);
     console.log(coordinates);

     counter++;
    }
};

clear = document.getElementById("Clear");
clear.onclick = function clearLayer() {
    counter=0;
    var c = document.getElementById("layer2");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.clearRect(0, 0, layer2.width, layer2.height);
}

//Other tesed code snipits

//Works! Writes data to a file or writes data to a new file
/*
fs.writeFile('C:/Users/Eric/human-vision/Images_2_Process/writing.txt', "1,2,3,4,5,6,7,8,9,10,11", function(err) {
  if (err) throw err;
  console.log("Saved");
});
*/

// WORKS! Asynchronous read data from file
    //    fs.readFile('C:/Users/Eric/human-vision/test.txt', function (err, data) {
      //     if (err) {
        //    alert(err);
          // }
           //else
           //{
            //document.write(data);
           // }
       // }); 

//WORKS! to transfer a file from one folder to another
/*
fs.rename('C:/Users/Eric/human-vision/Images_2_Process/VTOL.jpg','C:/Users/Eric/human-vision/Processed_Images/VTOL.jpg', function(err) {
    if (err) throw err;
    console.log("File successfully moved");
});
*/