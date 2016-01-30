var fs = require("fs");
var address;
var newaddress;
console.log("Start");

// Initial image is loaded into the GUI

fs.readdir("C:/Users/Eric/human-vision/Images_2_Process", function(err, files) {
    if (err) throw err;
    console.log(files); // gives an array of file names in folder
    console.log(files.length); // displays number of files in the folder
    console.log(files[0]); // displays name of individual file (starts counting at 0)

address = "C:/Users/Eric/human-vision/Images_2_Process/" + files[0];
//newaddress = "C:/Users/Eric/human-vision/Processed_Images/" + files[0];
   var img = new Image();
img.src = address;
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
img.onload = function() {
  ctx.drawImage(img, 0, 0);
  img.style.display = 'none';
};

//document.getElementById("image").innerHTML = "<img src='" +address+ "'>";
alert("Initial File successfully loaded");
});


 