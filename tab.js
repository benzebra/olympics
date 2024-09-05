var srcImages = [
    "resources/img/sword.avif", 
    "resources/img/volley.avif", 
    "resources/img/kayak.avif", 
    "resources/img/tennis.avif"];

var figures = [
    "sword", 
    "volleyball", 
    "kayak", 
    "tennis"
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
    tdArray = document.getElementsByTagName("td");
    for(var i=0; i<tdArray.length; i++) {
        innerText = "<img class='img-thumbnail' src=" + srcImages[i] + " onclick=imgClick('" + figures[i] + "') href=#canvas-div\>";
        console.log(innerText);
        tdArray[i].innerHTML = innerText;
    }
});

function imgClick(text) {
    switch(text){
        case "sword":
            objHref = 'resources/obj/logo/model.obj';
            break;
        case "volleyball":
            objHref = 'resources/obj/logo_2024/logo.obj';
            break;
        case "kayak":
            objHref = 'resources/obj/kayak/30daysinVRkayak.obj';
            break;
        case "tennis":
            objHref = 'resources/obj/tennis2/tennis.obj';
            break;
    }

    loaderMain()
}