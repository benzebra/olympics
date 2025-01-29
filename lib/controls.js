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
            controls.PHI = tmpPhi;
            old_y = event.pageY;
        }

        if(tmpTheta >= (-2*Math.PI) && tmpTheta <= (2*Math.PI)){
            controls.THETA = tmpTheta;
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
        controls.D = Dtmp;
    }ß
}

// keyboard
document.addEventListener('keydown', function(event) {
    event.preventDefault();

    switch(event.key){
        case ("a" || "ArrowLeft"):
            // A
            controls.THETA = controls.THETA - 0.3;
            break;
        case ("d" || "ArrowRight"):
            // D
            controls.THETA = controls.THETA + 0.3;
            break;
        case ("w" || "ArrowUp"):
            // W
            controls.PHI = controls.PHI + 0.3;
            break;
        case ("s" || "ArrowDown"):
            // S
            controls.PHI = controls.PHI - 0.3;
            break;
    }
});