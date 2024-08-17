"use strict";

var mesh = new Array();
var positions = [];
var normals = [];
var texcoords = [];
var numVertices;
var ambient;   //Ka
var diffuse;   //Kd
var specular;  //Ks
var emissive;  //Ke
var shininess; //Ns
var opacity;   //Ni

var flag = false;
var dr = 5.0 * Math.PI/180.0;

// var controls = {
// 	near : 1,
// 	far : 100,
// 	d : 8.5,
// 	fov : 40.0,  
// 	theta_light : degToRad(20),
// 	phi_light  : degToRad(80),
// 	d_light : 8.5,
// };

// add other specs (movement, light ecc)

function render(value, gl, specs, newRender) {
	if(flag) {
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		mesh 		= new Array();
		positions 	= [];
		normals 	= [];
		texcoords 	= [];
		numVertices = null;

		resetControls();
	}else{
		// var gui = new dat.GUI()

		// gui.add(controls, "near", 			1,		10, 	1);
		// gui.add(controls, "far", 			1, 		100, 	1);
		// gui.add(controls, "d", 				0, 		10, 	1);
		// gui.add(controls, "fov", 			10, 	120, 	5);
		// gui.add(controls, "theta_light", 	1, 		6.28, 	dr);
		// gui.add(controls, "phi_light", 		1, 		10, 	dr);
		// gui.add(controls, "d_light", 		1.75, 	10, 	1);
	}

	if(newRender){
		mesh.sourceMesh = value;
		LoadMesh(gl, mesh);
	}
	

	// setup GLSL program
	var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
	// Tell it to use our program (pair of shaders)
	gl.useProgram(program);

	// look up where the vertex data needs to go.
	var positionLocation = gl.getAttribLocation(program, "a_position");
	var normalLocation   = gl.getAttribLocation(program, "a_normal");
	var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

	// Create a buffer for normals, bind it to ARRAY_BUFFER and put the positions in the buffer
	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	// Create a buffer for normals, bind it to ARRAY_BUFFER and put the normals in the buffer
	var normalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	// provide texture coordinates
	var texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

	var ambientLight = [ 0, 0, 0 ];
	var colorLight	 = [ 1.0, 1.0, 1.0 ];

	gl.uniform3fv(gl.getUniformLocation(program, "diffuse" ), diffuse );
	gl.uniform3fv(gl.getUniformLocation(program, "ambient" ), ambient); 
	gl.uniform3fv(gl.getUniformLocation(program, "specular"), specular );	
	gl.uniform3fv(gl.getUniformLocation(program, "emissive"), emissive );
	// gl.uniform3fv(gl.getUniformLocation(program, "u_lightDirection" ), xxx );
	gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight" ), ambientLight );
	gl.uniform3fv(gl.getUniformLocation(program, "u_colorLight" ), colorLight );

	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);
	gl.uniform1f(gl.getUniformLocation(program, "opacity"), opacity);

	// Turn on the position attribute and bind the position buffer
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 3;          		// 3 components per iteration
	var type = gl.FLOAT;   		// the data is 32bit floats
	var normalize = false; 		// don't normalize the data
	var stride = 0;        		// 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        		// start at the beginning of the buffer
	gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

	// Turn on the normal attribute and bind the normal buffer
	gl.enableVertexAttribArray(normalLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);

	// Turn on the texcord attribute and bind the position buffer
	gl.enableVertexAttribArray(texcoordLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	size = 2;          // 2 components per iteration
	gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);

	var fieldOfViewRadians 		= degToRad(30);
	var modelXRotationRadians 	= degToRad(0);
	var modelYRotationRadians 	= degToRad(0);

	// define the radius of the sphere that contains the object in order to center the camera
	var range = m4.subtractVectors(getExtents().max, getExtents().min);
	var radius = m4.length(range) * 1.5;

	// Compute the projection matrix
	// var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	// var zmin = radius/100;
	// var zmax = radius*3;
	// var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, zmax);
	var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	var FOV = specs.fov;
	var NEAR = specs.near;
	var FAR = specs.far;
	var projectionMatrix = m4.perspective(degToRad(FOV), aspect, NEAR, FAR);
	console.log(projectionMatrix);

	// var cameraPosition = [0, 0, 1.5 * radius];
	// var up = [0, 1, 0];
	// var target = [0, 0, 0];
	var up = [0, 0, 1];
	var D = specs.d;
	var PHI = degToRad(80)
	var THETA = degToRad(20);
	var cameraPosition = [
		D*Math.sin(PHI)*Math.cos(THETA),
		D*Math.sin(PHI)*Math.sin(THETA),
		D*Math.cos(PHI)
	]
	var target = [0, 0, 0];
	console.log(cameraPosition);

	// Compute the camera's matrix using look at.
	var cameraMatrix = m4.lookAt(cameraPosition, target, up);

	// Make a view matrix from the camera matrix.
	var viewMatrix = m4.inverse(cameraMatrix);

	var matrixLocation 				= gl.getUniformLocation(program, "u_world");
	var textureLocation 			= gl.getUniformLocation(program, "diffuseMap");
	var viewMatrixLocation 			= gl.getUniformLocation(program, "u_view");
	var projectionMatrixLocation 	= gl.getUniformLocation(program, "u_projection");
	var lightWorldDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
	var viewWorldPositionLocation 	= gl.getUniformLocation(program, "u_viewWorldPosition");

	gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
	gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
			
	// set the light position
	gl.uniform3fv(lightWorldDirectionLocation, m4.normalize([-1, 3, 5]));

	// set the camera/view position
	gl.uniform3fv(viewWorldPositionLocation, cameraPosition);

	// Tell the shader to use texture unit 0 for diffuseMap
	gl.uniform1i(textureLocation, 0);

	function isPowerOf2(value) { return (value & (value - 1)) === 0; }

	function radToDeg(r) { return r * 180 / Math.PI; }

	function degToRad(d) { return d * Math.PI / 180; }

	// Get the starting time.
	var then = 0;

	requestAnimationFrame(drawScene);

	// Draw the scene.
	function drawScene(time) {
		flag = true;

		webglUtils.resizeCanvasToDisplaySize(gl.canvas);

		// convert to seconds
		time *= 0.001;
		// Subtract the previous time from the current time
		var deltaTime = time - then;
		// Remember the current time for the next frame.
		then = time;

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		//gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		// Animate the rotation
		modelYRotationRadians += -0.5 * deltaTime;
		modelXRotationRadians += -0.4 * deltaTime;

		// Clear the canvas AND the depth buffer.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var matrix = m4.identity();
		matrix = m4.xRotate(matrix, modelXRotationRadians);
		matrix = m4.yRotate(matrix, modelYRotationRadians);

		// Set the matrix.
		gl.uniformMatrix4fv(matrixLocation, false, matrix);

		// Draw the geometry.
		gl.drawArrays(gl.TRIANGLES, 0, numVertices);

		requestAnimationFrame(drawScene);
	}
}

function getExtents() {
	const min = positions.slice(0, 3);
	const max = positions.slice(0, 3);
	for (let i = 3; i < positions.length; i += 3) {
		for (let j = 0; j < 3; ++j) {
			const v = positions[i + j];
			min[j] = Math.min(v, min[j]);
			max[j] = Math.max(v, max[j]);
		}
	}

	return {min, max};
}

function resetControls(){
	controls = {
		near : 1,
		far : 100,
		d : 8.5,
		fov : 40.0,  
		theta_light : degToRad(20),
		phi_light  : degToRad(80),
		d_light : 8.5,
	}
}

function degToRad(d) { return d * Math.PI / 180; }
function radToDeg(r) { return r * 180 / Math.PI; }