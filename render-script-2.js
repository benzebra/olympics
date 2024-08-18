var positions = [];
var normals = [];
var texcoords = [];

var ambientLight = [ 0, 0, 0 ];
var colorLight	 = [ 1.0, 1.0, 1.0 ];

var ambient;   //Ka
var diffuse;   //Kd
var specular;  //Ks
var emissive;  //Ke
var shininess; //Ns
var opacity;   //Ni

var vMatrix;
var pMatrix;
var mMatrix;

var textureLocation;
var lightWorldDirectionLocation;
var viewWorldPositionLocation;

var aspect;
var program;

var THETA = degToRad(20);
var PHI = degToRad(80)
var target = [0,0,0]
var up = [0,0,1]

var controls = {
	near : 1,
	far : 100,
	d : 8.5,
	fov : 40.0,  
	theta_light : degToRad(20),
	phi_light  : degToRad(80),
	d_light : 8.5,
};

function render(value, gl){
// function render(value, gl, static){

    mesh.sourceMesh = value;
	LoadMesh(gl, mesh);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
    gl.useProgram(program);

	aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    vMatrix = gl.getUniformLocation(program, "u_view");
    pMatrix = gl.getUniformLocation(program, "u_projection");
    mMatrix = gl.getUniformLocation(program, "u_world");

    var positionLocation = gl.getAttribLocation(program, "a_position");
	var normalLocation   = gl.getAttribLocation(program, "a_normal");
	var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

    // Turn on the position attribute and bind the position buffer
    var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, size=3, type=gl.FLOAT, normalize=false, stride=0, offset=0);

    var normalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.vertexAttribPointer(normalLocation, size=3, type=gl.FLOAT, normalize=false, stride=0, offset=0);

    var texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texcoordLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.vertexAttribPointer(texcoordLocation, size=2, type=gl.FLOAT, normalize=false, stride=0, offset=0);

    gl.uniform3fv(gl.getUniformLocation(program, "diffuse" ),           diffuse );
	gl.uniform3fv(gl.getUniformLocation(program, "ambient" ),           ambient); 
	gl.uniform3fv(gl.getUniformLocation(program, "specular"),           specular );	
	gl.uniform3fv(gl.getUniformLocation(program, "emissive"),           emissive );
    gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight" ),    ambientLight );
	gl.uniform3fv(gl.getUniformLocation(program, "u_colorLight" ),      colorLight );
	gl.uniform1f(gl.getUniformLocation(program, "shininess"),           shininess);
	gl.uniform1f(gl.getUniformLocation(program, "opacity"),             opacity);

    textureLocation 			= gl.getUniformLocation(program, "diffuseMap");
	lightWorldDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
	viewWorldPositionLocation 	= gl.getUniformLocation(program, "u_viewWorldPosition");

    // if(static){
    //     // do the static render
    //     staticRender();
    // }else{
    //     // start the dynamic render
    //     dynamicRender();
    // }
    staticRender();
}


/*
dynamicRender()
It allows to render the figure in order to make it rotate in the space.
The control menu isn't active for this case, so there is a fixed camera position.
*/
function dynamicRender(){

    var modelXRotationRadians = degToRad(0);
	var modelYRotationRadians = degToRad(0);

	var then = 0;

    requestAnimationFrame(drawScene);

    function drawScene(time) {
		flag = true;

		webglUtils.resizeCanvasToDisplaySize(gl.canvas);

		// time computation
		time *= 0.001;
		var deltaTime = time - then;
		then = time;

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		// Animate the rotation
		modelYRotationRadians += -0.5 * deltaTime;
		modelXRotationRadians += -0.4 * deltaTime;

		// Clear the canvas AND the depth buffer.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		matrix = m4.identity();
		matrix = m4.xRotate(matrix, modelXRotationRadians);
		matrix = m4.yRotate(matrix, modelYRotationRadians);
		gl.uniformMatrix4fv(matrixLocation, false, matrix);

		// Draw the geometry.
		gl.drawArrays(gl.TRIANGLES, 0, numVertices);

		// requestAnimationFrame(drawScene);
	}
}


/*
staticRender()
The GUI control panel is workng, so the user can set the preferred fov, distance, ecc
*/
function staticRender(){
    D           = controls.d;
    theta_light = controls.theta_light;
    phi_light   = controls.phi_light;
    d_light     = controls.d_light;
    fov         = controls.fov;
    near        = controls.near;
    far         = controls.far;

    var proj_matrix = m4.perspective(degToRad(fov), aspect, near, far)
    var camera_matrix = [
        D * Math.sin(PHI) * Math.cos(THETA),
        D * Math.sin(PHI) * Math.sin(THETA),
        D * Math.cos(PHI),
    ];
    var view_matrix = m4.inverse(m4.lookAt(camera_matrix, target, up));
    var mov_matrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
    var light = [
        d_light * Math.sin(phi_light) * Math.cos(theta_light),
        d_light * Math.sin(phi_light) * Math.sin(theta_light),
        d_light * Math.cos(phi_light),
        1
    ];

    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(1.0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(vMatrix, false, view_matrix);
	gl.uniformMatrix4fv(pMatrix, false, proj_matrix);
    gl.uniformMatrix4fv(mMatrix, false, mov_matrix);

	gl.uniform3fv(lightWorldDirectionLocation, m4.normalize([-1, 3, 5]));   // light position
	gl.uniform3fv(viewWorldPositionLocation, camera_matrix);                // camera/view position

	// Tell the shader to use texture unit 0 for diffuseMap
	gl.uniform1i(textureLocation, 0);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function degToRad(d) { return d * Math.PI / 180; }
function radToDeg(r) { return r * 180 / Math.PI; }
function isPowerOf2(val) { return (val & (val - 1)) === 0; }