canvas = document.getElementById("canvas-first");
gl = canvas.getContext("webgl");

let objIndex = 0;

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

setRenderStatus(1, gl);

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(10, gl, meshProgramInfo, canvas);
