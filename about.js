const urlRes = "/olympics/res/articles/";

let canvas = document.getElementById("about-canvas");
gl = canvas.getContext("webgl");

if(!gl){
    console.log("WebGL not supported, falling back on experimental-webgl");
}

const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

main(21, gl, meshProgramInfo, true, canvas);

loadContent(urlRes + "me" + ".html");