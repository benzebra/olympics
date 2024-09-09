var srcImages = [
    "/img/sword.avif", 
    "/img/volley.avif", 
    "/img/kayak.avif", 
    "/img/tennis.avif",
    "/img/cycling.avif",
    "/img/shooting.avif"
];

var figures = [
    "sword", 
    "volley", 
    "kayak", 
    "tennis",
    "cycling",
    "shooting"
];

var gl;
var gui;
var value;

// var controls = {
// 	near : 1,
// 	far : 100,
// 	d : 8.5,
// 	fov : 40.0,  
// 	theta_light : degToRad(20),
// 	phi_light  : degToRad(80),
// 	d_light : 8.5,
// };

document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById("my-canvas");
	gl = canvas.getContext("webgl");
	if (!gl) {
		return;
	}

    // gui = new dat.GUI();
    // gui.add(controls, "near", 			1,		10, 	1).onChange(function() {render(value, gl, controls, false)});
    // gui.add(controls, "far", 			1, 		100, 	1).onChange(function() {render(value, gl, controls, false)});
    // gui.add(controls, "d", 				0, 		10, 	1).onChange(function() {render(value, gl, controls, false)});
    // gui.add(controls, "fov", 			10, 	120, 	5).onChange(function() {render(value, gl, controls, false)});
    // // gui.add(controls, "theta_light", 	1, 		6.28, 	dr).onChange(function() {render(value, gl, controls, false)});
    // // gui.add(controls, "phi_light", 		1, 		10, 	dr).onChange(function() {render(value, gl, controls, false)});
    // gui.add(controls, "d_light", 		1.75, 	10, 	1).onChange(function() {render(value, gl, controls, false)});

    // attach to each td element a link to google
    // tdArray = document.getElementsByTagName("td");
    // for(var i=0; i<tdArray.length; i++) {
    //     innerText = "<img class='img-thumbnail border-0' src=" + srcImages[i] + " onclick=imgClick('" + figures[i] + "') href=#canvas-div\>";
    //     console.log(innerText);
    //     tdArray[i].innerHTML = innerText;
    // }
    tdArray = document.getElementsByTagName("li");
    tdArray = document.getElementsByName("dropdown-element");
    for(var i=0; i<tdArray.length; i++) {
        innerText = "<img class='img-thumbnail border-0' src=" + srcImages[i] + " onclick=imgClick('" + figures[i] + "') href=#canvas-div\>";
        console.log(innerText);
        tdArray[i].innerHTML = innerText + tdArray[i].innerHTML;
    }
});

function imgClick(text) {
    switch(text){
        case "sword":
            objHref = 'resources/obj/sword/sword.obj';
            break;
        case "volley":
            objHref = 'resources/obj/volley/volley.obj';
            break;
        case "kayak":
            objHref = 'resources/obj/kayak/30daysinVRkayak.obj';
            break;
        case "tennis":
            objHref = 'resources/obj/tennis_racket/tennis_racket.obj';
            break;
        case "cycling":
            objHref = 'resources/obj/bike/bike.obj';
            break;
        case "shooting":
            objHref = 'resources/obj/shotgun/shotgun.obj';
            break;
    }

    loaderMain()
}