const urlRes = "/res/articles/";
const urlParams = new URLSearchParams(window.location.search);
const index = urlParams.get("index");

let canvas = document.getElementById("focus-canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(index, gl, meshProgramInfo, true, canvas);


const gui = new dat.GUI();
gui.name = "Controls";
// gui.closed = true;
// gui.autoPlace = true;
gui.add(controls, "posX", 	    0,		    10,             1);
gui.add(controls, "posY", 	    0, 		    10, 	        1);
gui.add(controls, "D", 		    0, 		    30, 	        1);
gui.add(controls, "THETA", 	    0, 	        2*Math.PI, 	    0.1);
gui.add(controls, "PHI", 	    -Math.PI/2, Math.PI/2-0.1, 	0.1);
gui.add(controls, "shininess", 	40, 	    200, 	        5);
gui.add(controls, "Ka", 	    0, 	        1, 	            0.1);
gui.add(controls, "Kd", 	    0, 	        1, 	            0.1);
gui.add(controls, "Ks", 	    0, 	        1, 	            0.1);


function handleDatGuiVisibility() {
    const guiContainer = document.getElementsByClassName('dg ac')[0];
    if (window.innerWidth <= 768) { // Adjust 768 to your breakpoint for mobile devices
        guiContainer.style.display = 'none'; // Hide the GUI on mobile
    } else {
        guiContainer.style.display = ''; // Show the GUI on desktop
    }
}

function loadArticle(i) {
    content = fetch(urlRes + i + ".html");
    content.then(response => response.text()).then(text => {
        document.getElementById("article").innerHTML = text;
    });
}

handleDatGuiVisibility()

loadArticle(index)