const canvas = document.getElementsByTagName("canvas");

for(let i=0; i<canvas.length; i++){
    let gl = canvas[i].getContext("webgl");        

    if(!gl){
        console.log("WebGL not supported, falling back on experimental-webgl");
    }

    setRenderStatus(0);

    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

    main(i, gl, meshProgramInfo, canvas[i]);

    canvas[i].addEventListener("mouseover", function(event){
        // set the render status to spinning
        setRenderStatus(2, gl);
    });

    canvas[i].addEventListener("mouseout", function(event){
        // set the render status to not spinning
        setRenderStatus(0, gl);
    });
}

