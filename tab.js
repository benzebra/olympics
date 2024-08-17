var srcImages = ["resources/img/kayak.avif", "resources/img/kayak.avif", "resources/img/kayak.avif", "resources/img/tennis.avif"];
var figures = ["swim", "sword", "kayak", "tennis"];
var gl;

document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById("my-canvas");
	gl = canvas.getContext("webgl");
	if (!gl) {
		return;
	}

    //insert text in canvas until the 3D model is selected

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
        case "swim":
            value = 'resources/obj/swim/Swim.obj';
            break;
        case "sword":
            value = 'resources/obj/sword/Sword.obj';
            break;
        case "kayak":
            value = 'resources/obj/kayak/30daysinVRkayak.obj';
            break;
        case "tennis":
            // value = 'resources/obj/tennis/Ball_1H.obj';
            value = 'resources/obj/tennis-racket/06-12-19_tennis_racket_export_v1.obj';
            break;
    }

    render(value, gl);
}


