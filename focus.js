const urlParams = new URLSearchParams(window.location.search);
const index = urlParams.get("index");

let canvas = document.getElementById("canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(index, gl, meshProgramInfo, true, canvas);


gui = new dat.GUI();
gui.add(controls, "posX", 	    0,		10,     1);
gui.add(controls, "posY", 	    0, 		10, 	1);
gui.add(controls, "D", 		    0, 		20, 	1);
gui.add(controls, "THETA", 	    0, 	    10, 	0.1);
gui.add(controls, "PHI", 	    0,   	10, 	0.1);
gui.add(controls, "shininess", 	40, 	200, 	5);
gui.add(controls, "Ka", 	    0, 	    1, 	    0.1);
gui.add(controls, "Kd", 	    0, 	    1, 	    0.1);
gui.add(controls, "Ks", 	    0, 	    1, 	    0.1);
