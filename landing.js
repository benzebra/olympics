var gl;

document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById("my-canvas");
	gl = canvas.getContext("webgl");
	if (!gl) {
		return;
	}

    render("resources/obj/logo/model.obj", gl);
});