var controls = getControls();


var pressDown = function(event) {
    drag = true;
    old_x = event.pageX 
    old_y = event.pageY;
    
    event.preventDefault();
    
    return false;
};

var pressUp = function(event){
    drag = false;

    event.preventDefault();
};

var pressOut = function(event){
    drag = false;

    event.preventDefault();
};

var pressMove = canvas.onmousemove = function(event) {
    if (drag) {
        let tmpTheta = controls.THETA + (event.pageX - old_x) * 0.01;
        let tmpPhi = controls.PHI + (event.pageY - old_y) * 0.01;

        if(tmpPhi >= (-Math.PI/2+0.1) && tmpPhi <= (Math.PI/2-0.1) && tmpTheta >= 0 && tmpTheta <= 2*Math.PI){
            controls.THETA = tmpTheta;
            controls.PHI = tmpPhi;
        
            old_x = event.pageX;
            old_y = event.pageY;
        }
    }
    event.preventDefault();
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
    let Dtmp;
    if(event.deltaY < 0){
        Dtmp = controls.D - 1;
    }else{
        Dtmp = controls.D + 1;
    }

    if(Dtmp >= 0 && Dtmp <= 30){
        controls.D = Dtmp;
    }

    event.preventDefault();
}

// keyboard
document.addEventListener('keydown', function(event) {
    if(event.keyCode == 65){
        // A
        controls.THETA = controls.THETA - 0.1;
    }else if(event.keyCode == 68){
        // D
        controls.THETA = controls.THETA + 0.1; 
    }else if(event.keyCode == 87){
        // W
        controls.PHI = controls.PHI + 0.1;
    }else if(event.keyCode == 83){
        // S
        controls.PHI = controls.PHI - 0.1;
    }

    event.preventDefault();
});