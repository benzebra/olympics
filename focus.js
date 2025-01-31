const urlRes = "./res/articles/";
const urlParams = new URLSearchParams(window.location.search);
const index = urlParams.get("index");

let canvas = document.getElementById("focus-canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(index, gl, meshProgramInfo);

setRenderStatus(3, gl);

loadContent(urlRes + index + ".html")