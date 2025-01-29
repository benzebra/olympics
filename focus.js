const urlRes = "./res/articles/";
const urlParams = new URLSearchParams(window.location.search);
const index = urlParams.get("index");

let canvas = document.getElementById("focus-canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(index, gl, meshProgramInfo, canvas);

setRenderStatus(3, gl)

const gui = new dat.GUI();
gui.name = "Controls";
gui.add(controls, "D", 		    0, 		            30, 	        1);
gui.add(controls, "THETA", 	    0, 	                2*Math.PI, 	    0.1);
gui.add(controls, "PHI", 	    -Math.PI/2+0.1,     Math.PI/2-0.1, 	0.1);
gui.add(controls, "Ka", 	    0, 	                1, 	            0.1);
gui.add(controls, "Kd", 	    0, 	                1, 	            0.1);
gui.add(controls, "Ks", 	    0, 	                1, 	            0.1);
gui.add(controls, "xLight", 	-20, 	            20, 	        1);
gui.add(controls, "yLight", 	-20, 	            20, 	        1);
gui.add(controls, "zLight", 	-20, 	            20, 	        1);


function handleDatGuiVisibility() {
    const guiContainer = document.getElementsByClassName('dg ac')[0];
    if (window.innerWidth <= 768) { // Adjust 768 to your breakpoint for mobile devices
        guiContainer.style.display = 'none'; // Hide the GUI on mobile
    } else {
        guiContainer.style.display = ''; // Show the GUI on desktop
    }
}

handleDatGuiVisibility()

loadContent(urlRes + index + ".html")