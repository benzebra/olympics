var controls = getControls();


var pressDown = function(e) {
    drag = true;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
    return false;
};

var pressUp = function(e){
    drag = false;
};

var pressOut = function(e){
    drag = false;
};

var pressMove = function(e) {
    if (!drag) return false; 

    controls.dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width; 
    controls.dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height; 
    controls.THETA -= controls.dX;

    if (controls.PHI + controls.dY >= 0 && controls.PHI + controls.dY <= Math.PI)
        controls.PHI += controls.dY;

    old_x = e.pageX;
    old_y = e.pageY; 
    e.preventDefault();
};

canvas.ontouchstart = pressDown;
canvas.onmousedown = pressDown;
canvas.ontouchend = pressUp;
canvas.onmouseup = pressUp;
canvas.onmousemove = pressMove;
canvas.ontouchmove = pressMove;
canvas.mouseout = pressOut;
canvas.touchcancel = pressOut;

canvas.onwheel = function(event){
    if(event.deltaY < 0){
        controls.D = controls.D - 0.5;
    }else{
        controls.D = controls.D + 0.5;
    }
}

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
});