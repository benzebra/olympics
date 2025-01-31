var controls = getControls();

var pressDown = function(event) {
    event.preventDefault();

    drag = true;
    old_x = event.pageX 
    old_y = event.pageY;
    
    return false;
};

var pressUp = function(event){
    event.preventDefault();

    drag = false;
};

var pressOut = function(event){
    event.preventDefault();

    drag = false;
};

var pressMove = canvas.onmousemove = function(event) {
    event.preventDefault();

    if (drag) {
        let tmpTheta = controls.THETA + (event.pageX - old_x) * 0.01;
        let tmpPhi = controls.PHI + (event.pageY - old_y) * 0.01;

        if(tmpPhi >= ((-Math.PI/2)+0.1) && (tmpPhi <= ((Math.PI/2)-0.1))){
            phiController.setValue(tmpPhi);
            old_y = event.pageY;
        }

        if(tmpTheta >= (-2*Math.PI) && tmpTheta <= (2*Math.PI)){
            thetaController.setValue(tmpTheta);
            old_x = event.pageX;
        }
    }
};

canvas.ontouchstart = pressDown;
canvas.onmousedown = pressDown;
canvas.ontouchend = pressUp;
canvas.onmouseup = pressUp;
canvas.onmousemove = pressMove;
canvas.ontouchmove = pressMove;
canvas.mouseout = pressOut;
canvas.touchcancel = pressOut;

// scroll
canvas.onwheel = function(event){
    event.preventDefault();

    let Dtmp;
    if(event.deltaY < 0){
        Dtmp = controls.D - 1;
    }else{
        Dtmp = controls.D + 1;
    }

    if(Dtmp >= 0 && Dtmp <= 30){
        dController.setValue(Dtmp);
    }
}

// keyboard
document.addEventListener('keydown', function(event) {
    event.preventDefault();

    switch(event.key){
        case "a":
            thetaController.setValue(controls.THETA - 0.3);
            break;
        case "ArrowLeft":
            thetaController.setValue(controls.THETA - 0.3);
            break;

        case "d":
            thetaController.setValue(controls.THETA + 0.3);
            break;
        case "ArrowRight":
            thetaController.setValue(controls.THETA + 0.3);
            break;

        case "w":
            phiController.setValue(controls.PHI + 0.3);
            break;
        case "ArrowUp":
            phiController.setValue(controls.PHI + 0.3);
            break;

        case "s":
            phiController.setValue(controls.PHI - 0.3);
            break;
        case "ArrowDown":
            phiController.setValue(controls.PHI - 0.3);
            break;
    }
});

const gui = new dat.GUI();
gui.name = "Controls";
const dController = gui.add(controls, "D", 		    0, 		            30, 	        1);
const thetaController = gui.add(controls, "THETA", 	    0, 	                2*Math.PI, 	    0.1);
const phiController = gui.add(controls, "PHI", 	    -Math.PI/2+0.1,     Math.PI/2-0.1, 	0.1);
gui.add(controls, "Ka", 	    0, 	                1, 	            0.1);
gui.add(controls, "Kd", 	    0, 	                1, 	            0.1);
gui.add(controls, "Ks", 	    0, 	                1, 	            0.1);
gui.add(controls, "xLight", 	-100, 	            100, 	        1);
gui.add(controls, "yLight", 	-100, 	            100, 	        1);
gui.add(controls, "zLight", 	-100, 	            100, 	        1);


function handleGuiVisibility() {
    const guiContainer = document.getElementsByClassName("dg ac")[0];
    const modalGui = document.getElementById("modalGui");
    if (window.innerWidth <= 768) { // Adjust 768 to your breakpoint for mobile devices
        // guiContainer.style.d isplay = "none"; 
        modalGui.style.display = "none"; 
    } else {
        guiContainer.style.display = ''; 
        modalGui.style.display = ''; 
    }
}

handleGuiVisibility()