async function main(objUrl, gl, meshProgramInfo){
    this.t = 0.0;
    this.modeVal = 1;
    this.lightPos = [1.0, 1.0, -1.0];
    this.lightVec = new Float32Array(3);
    this.ambientColor = [0.2, 0.1, 0.0];
    this.diffuseColor = [0.8, 0.4, 0.0];
    this.specularColor = [1.0, 1.0, 1.0];
    this.clearColor = [0.0, 0.4, 0.7];
    this.attenuation = 0.01;
    this.shininess = 80.0;
    this.kaVal = 1.0;
    this.kdVal = 1.0;
    this.ksVal = 1.0;

    // private members (inside closure)
    var canvasName = canvasName;
    var vertSrc = vertSrc;
    var fragSrc = fragSrc;
    var gl;
    var sceneVertNo = 0;
    var bufID;
    var progID = 0;
    var vertID = 0;
    var fragID = 0;
    var vertexLoc = 0;
    var texCoordLoc = 0;
    var normalLoc = 0;
    var projectionLoc = 0;
    var modelviewLoc = 0;
    var normalMatrixLoc = 0;
    var modeLoc = 0;
    var kaLoc = 0;
    var kdLoc = 0;
    var ksLoc = 0;
    var attenuationLoc = 0;
    var shininessLoc = 0;
    var lightPosLoc = 0;
    var lightVecLoc = 0;
    var ambientColorLoc = 0;
    var diffuseColorLoc = 0;
    var specularColorLoc = 0;
    var projection = new Float32Array(16);
    var modelview = new Float32Array(16);

    const objHref = objUrl; 
    const response = await fetch(objHref);
    const text = await response.text();
    const obj = parseOBJ(text);
    const baseHref = new URL(objHref, window.location.href);
    const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHref).href;
        const response = await fetch(matHref);
        return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));

    const textures = {
        defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
    };

    // load texture for materials
    for (const material of Object.values(materials)) {
        Object.entries(material)
        .filter(([key]) => key.endsWith('Map'))
        .forEach(([key, filename]) => {
            let texture = textures[filename];
            if (!texture) {
                const textureHref = new URL(filename, baseHref).href;
                texture = createTexture(gl, textureHref);
                textures[filename] = texture;
            }
            material[key] = texture;
        });
    }

    const defaultMaterial = {
        diffuse: [1, 1, 1],
        diffuseMap: textures.defaultWhite,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 400,
        opacity: 1,
    };

    const parts = obj.geometries.map(({material, data}) => {
        if (data.color) {
            if (data.position.length === data.color.length) {
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            data.color = { value: [1, 1, 1, 1] };
        }

        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
        return {
            material: {
                ...defaultMaterial,
                ...materials[material],
            },
            bufferInfo,
        };
    });

    function getExtents(positions) {
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

    function getGeometriesExtents(geometries) {
        return geometries.reduce(({min, max}, {data}) => {
            const minMax = getExtents(data.position);
            return {
                min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
                max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
            };
        }, {
            min: Array(3).fill(Number.POSITIVE_INFINITY),
            max: Array(3).fill(Number.NEGATIVE_INFINITY),
        });
    }

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    const cameraTarget = [0, 0, 0];
    const radius = m4.length(range) * 1.2;
    const cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);

    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    progID = meshProgramInfo.program;

    // retrieve the location of the IN variables of the vertex shader
    vertexLoc = gl.getAttribLocation(progID,   "position");
    texCoordLoc =  gl.getAttribLocation(progID,"texCoord");
    normalLoc = gl.getAttribLocation(progID,   "normal");

    // retrieve the location of the UNIFORM variables of the shader
    projectionLoc = gl.getUniformLocation(progID, "projection");
    modelviewLoc = gl.getUniformLocation(progID, "modelview");
    normalMatrixLoc = gl.getUniformLocation(progID, "normalMat");
    modeLoc = gl.getUniformLocation(progID, "mode");
    lightPosLoc = gl.getUniformLocation(progID, "lightPos");
    lightVecLoc = gl.getUniformLocation(progID, "lightVec");
    ambientColorLoc = gl.getUniformLocation(progID, "ambientColor");
    diffuseColorLoc = gl.getUniformLocation(progID, "diffuseColor");
    specularColorLoc = gl.getUniformLocation(progID, "specularColor");
    shininessLoc = gl.getUniformLocation(progID, "shininessVal");
    attenuationLoc = gl.getUniformLocation(progID, "attenuationVal");
    kaLoc = gl.getUniformLocation(progID, "Ka");
    kdLoc = gl.getUniformLocation(progID, "Kd");
    ksLoc = gl.getUniformLocation(progID, "Ks");

    if(modeLoc != -1) gl.uniform1i(modeLoc, this.modeVal);
    if(kaLoc != -1) gl.uniform1f(kaLoc, this.kaVal);
    if(kdLoc != -1) gl.uniform1f(kdLoc, this.kdVal);
    if(ksLoc != -1) gl.uniform1f(ksLoc, this.ksVal);
    if(attenuationLoc != -1) gl.uniform1f(attenuationLoc, this.attenuation);
    if(shininessLoc != -1) gl.uniform1f(shininessLoc, this.shininess);
    if(lightPosLoc != -1) gl.uniform3fv(lightPosLoc, this.lightPos);
    if(lightVecLoc != -1) gl.uniform3fv(lightVecLoc, this.lightVec);
    if(ambientColorLoc != -1) gl.uniform3fv(ambientColorLoc, this.ambientColor);
    if(diffuseColorLoc != -1) gl.uniform3fv(diffuseColorLoc, this.diffuseColor);
    if(specularColorLoc != -1) gl.uniform3fv(specularColorLoc, this.specularColor);

    function render(time) {
        time *= 0.001;  // convert to seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        const up = [0, 1, 0];
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);

        // const sharedUniforms = {
        //     u_lightDirection: m4.normalize([-1, 3, 5]),
        //     u_view: view,
        //     u_projection: projection,
        //     u_viewWorldPosition: cameraPosition,
        //     u_shininessVal: 2,
        //     Ka: 1,
        //     Kd: 1,
        //     Ks: 1,
        // };

        gl.useProgram(meshProgramInfo.program);

        // webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        let u_world = m4.yRotation(time)
        u_world = m4.translate(u_world, ...objOffset);

        for (const {bufferInfo, material} of parts) {
            webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
            webglUtils.setUniforms(meshProgramInfo, {
                u_world
            }, material);
            webglUtils.drawBufferInfo(gl, bufferInfo);
        }
        requestAnimationFrame(render);
    }

    render(0);
}
