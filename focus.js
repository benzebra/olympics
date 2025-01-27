const urlParams = new URLSearchParams(window.location.search);
const index = urlParams.get("index");
console.log(index)

let canvas = document.getElementById("canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(index, gl, meshProgramInfo, true, canvas);