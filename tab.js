var srcImages = []
var figures = ["swim", "sword", "kayak", "windsurf"];
var gl;

document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById("sport-canvas");
	gl = canvas.getContext("webgl");
	if (!gl) {
		return;
	}

    //insert text in canvas until the 3D model is selected

    // attach to each td element a link to google
    tdArray = document.getElementsByTagName("td");
    for(var i=0; i<tdArray.length; i++) {
        innerText = "<img src=" + srcImages[i] + " onclick=imgClick('" + figures[i] + "') >";
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
        case "windsurf":
            value = 'resources/obj/windsurf/Windsurf.obj';
            break;
    }

    render(value, gl);
}


