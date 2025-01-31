const urlRes = "./res/articles/";

let canvas = document.getElementById("about-canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(21, gl, meshProgramInfo);

setRenderStatus(4, gl)

loadContent(urlRes + "me" + ".html");