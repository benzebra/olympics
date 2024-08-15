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

// add other specs (movement, light ecc)

function render(value, gl) {
	// var canvas = document.getElementById("my-canvas");
	// var gl = canvas.getContext("webgl");
	// if (!gl) {
	// 	return;
	// }
	// mesh.sourceMesh = 'resources/obj/torch/torch.obj';
    //mesh.sourceMesh = 'resources/obj/olympics-torch/source/TO SUBSTANCE .obj';
    // mesh.sourceMesh = 'resources/obj/soccerball/soccerball.obj';
	// mesh.sourceMesh = 'resources/obj/girl/Sport_girl.obj';
	// mesh.sourceMesh = 'resources/obj/Painter1/Shoes--HH-A1.obj';
	// mesh.sourceMesh = 'resources/obj/logo/model.obj';
	// mesh.sourceMesh = 'resources/obj/lady/Ledy_Sport.obj';
	// mesh.sourceMesh = 'resources/obj/chair/chair.obj';
	mesh.sourceMesh = value;
	console.log(mesh)
	LoadMesh(gl, mesh);
	//console.log(mesh);

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
	// Set Texcoords
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

	// Turn on the position attribute
	gl.enableVertexAttribArray(positionLocation);
	// Bind the position buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 3;          // 3 components per iteration
	var type = gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

	// Turn on the normal attribute
	gl.enableVertexAttribArray(normalLocation);
	// Bind the normal buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);

	// Turn on the texcord attribute
	gl.enableVertexAttribArray(texcoordLocation);
	// Bind the position buffer.
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	size = 2;          // 2 components per iteration
	gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);

	var fieldOfViewRadians = degToRad(30);
	var modelXRotationRadians = degToRad(0);
	var modelYRotationRadians = degToRad(0);

	var radius = 3.50;

	// Compute the projection matrix
	var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	//  zmin=0.125;
	// var zmin = 0.1;
	var zmin = radius/100;
	var zmax = radius*3;
	var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zmin, zmax);

	// var extents = getGeometriesExtents(obj.geometries);
	// var range = m4.subtractVectors(extents.max, extents.min);
	

	var cameraPosition = [0, 0, 1.5 * radius];
	var up = [0, 1, 0];
	var target = [0, 0, 0];

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