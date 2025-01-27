const canvas = document.getElementsByTagName("canvas");

for(let i=0; i<canvas.length; i++){
    let gl = canvas[i].getContext("webgl");        

    if(!gl){
        console.log("WebGL not supported, falling back on experimental-webgl");
    }

    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

    main(i, gl, meshProgramInfo, false, canvas[i]);
}