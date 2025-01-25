"use strict";

let posX=0, posY=0;
let D = 6;
let drag = false;
let old_x, old_y;
let dX=0, dY=0;
let shininess = 400;


// This is not a full .obj parser.
// see http://paulbourke.net/dataformats/obj/

function parseOBJ(text) {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];

    // same order as `f` indices
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
        objColors,
    ];

    // same order as `f` indices
    let webglVertexData = [
        [],   // positions
        [],   // texcoords
        [],   // normals
        [],   // colors
    ];

    const materialLibs = [];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    const noop = () => {};

    function newGeometry() {
        // If there is an existing geometry and it's
        // not empty then start a new one.
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            const color = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
                color,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    position,
                    texcoord,
                    normal,
                    color,
                },
            };
            geometries.push(geometry);
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
            // if this is the position index (index 0) and we parsed
            // vertex colors then copy the vertex colors to the webgl vertex color data
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    const keywords = {
        v(parts) {
            // if there are more than 3 values here they are vertex colors
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else {
                objPositions.push(parts.map(parseFloat));
            }
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            // should check for missing v and extra w?
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            setGeometry();
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: noop,    // smoothing group
        mtllib(parts, unparsedArgs) {
            // the spec says there can be multiple filenames here
            // but many exist with spaces in a single filename
            materialLibs.push(unparsedArgs);
        },
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        g(parts) {
            groups = parts;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    // remove any arrays that have no entries.
    for (const geometry of geometries) {
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(([, array]) => array.length > 0));
    }

    return {
        geometries,
        materialLibs,
    };
}

function parseMapArgs(unparsedArgs) {
    // TODO: handle options
    return unparsedArgs;
}

function parseMTL(text) {
    const materials = {};
    let material;

    const keywords = {
        newmtl(parts, unparsedArgs) {
            material = {};
            materials[unparsedArgs] = material;
        },
        /* eslint brace-style:0 */
        Ns(parts)       { material.shininess      = parseFloat(parts[0]); },
        Ka(parts)       { material.ambient        = parts.map(parseFloat); },
        Kd(parts)       { material.diffuse        = parts.map(parseFloat); },
        Ks(parts)       { material.specular       = parts.map(parseFloat); },
        Ke(parts)       { material.emissive       = parts.map(parseFloat); },
        map_Kd(parts, unparsedArgs)   { material.diffuseMap = parseMapArgs(unparsedArgs); },
        map_Ns(parts, unparsedArgs)   { material.specularMap = parseMapArgs(unparsedArgs); },
        map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
        Ni(parts)       { material.opticalDensity = parseFloat(parts[0]); },
        d(parts)        { material.opacity        = parseFloat(parts[0]); },
        illum(parts)    { material.illum          = parseInt(parts[0]); },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return materials;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array(pixel));
    return texture;
}

function createTexture(gl, url) {
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });
    return texture;
}


async function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementsByTagName("canvas");
    
    let gl = [];
    let meshProgramInfo = []
    let textures = [];

    const vs = `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;
    attribute vec4 a_color;

    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_world;
    uniform vec3 u_viewWorldPosition;

    varying vec3 v_normal;
    varying vec3 v_surfaceToView;
    varying vec2 v_texcoord;
    varying vec4 v_color;

    void main() {
        vec4 worldPosition = u_world * a_position;
        gl_Position = u_projection * u_view * worldPosition;
        v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
        v_normal = mat3(u_world) * a_normal;
        v_texcoord = a_texcoord;
        v_color = a_color;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying vec3 v_surfaceToView;
    varying vec2 v_texcoord;
    varying vec4 v_color;

    uniform vec3 diffuse;
    uniform sampler2D diffuseMap;
    uniform vec3 ambient;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;
    uniform vec3 u_lightDirection;
    uniform vec3 u_ambientLight;

    void main () {
        vec3 normal = normalize(v_normal);

        vec3 surfaceToViewDirection = normalize(v_surfaceToView);
        vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

        float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
        float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

        vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
        vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
        float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

        gl_FragColor = vec4(
            emissive +
            ambient * u_ambientLight +
            effectiveDiffuse * fakeLight +
            specular * pow(specularLight, shininess),
            effectiveOpacity);
    }
    `;

    for (let i = 0; i < canvas.length; i++) {
        gl[i] = canvas[i].getContext("webgl");
        meshProgramInfo[i] = webglUtils.createProgramInfo(gl[i], [vs, fs]);

        textures[i] = {
            defaultWhite: create1PixelTexture(gl[i], [255, 255, 255, 255]),
        };
    }

    const aspect = gl[1].canvas.clientWidth / gl[1].canvas.clientHeight;


    // compiles and links the shaders, looks up attribute and uniform locations

    const objHref = 'models/logo/model.obj'; 
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

    // load texture for materials
    for(let i=0; i<canvas.length; i++){
        for (const material of Object.values(materials)) {
            Object.entries(material)
            .filter(([key]) => key.endsWith('Map'))
            .forEach(([key, filename]) => {
                let texture = textures[filename];
                if (!texture) {
                    const textureHref = new URL(filename, baseHref).href;
                    texture = createTexture(gl[i], textureHref);
                    textures[filename] = texture;
                }
                material[key] = texture;
            });
        }
    }

    const defaultMaterial = {
        diffuse: [1, 1, 1],
        diffuseMap: textures.defaultWhite,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 400,
        opacity: 1,
    };

    let parts = []
    for(let i=0; i<canvas.length; i++){
        parts[i] = obj.geometries.map(({material, data}) => {
            if (data.color) {
                if (data.position.length === data.color.length) {
                    // it's 3. The our helper library assumes 4 so we need
                    // to tell it there are only 3.
                    data.color = { numComponents: 3, data: data.color };
                }
            } else {
                // there are no vertex colors so just use constant white
                data.color = { value: [1, 1, 1, 1] };
            }
    
            // create a buffer for each array by calling
            // gl.createBuffer, gl.bindBuffer, gl.bufferData
            let bufferInfo = webglUtils.createBufferInfoFromArrays(gl[i], data);
            return {
                material: {
                    ...defaultMaterial,
                    ...materials[material],
                },
                bufferInfo,
            };
        });
    }

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
    // amount to move the object so its center is at the origin
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    const cameraTarget = [0, 1, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    const radius = m4.length(range) * 1.2;
    // const cameraPosition = m4.addVectors(cameraTarget, [
    //     0,
    //     0,
    //     radius,
    // ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    let THETA = degToRad(20), PHI = degToRad(80);
    let fieldOfViewRadians = degToRad(60);

    function render() {
        for(let i = 0; i < canvas.length; i++){
            webglUtils.resizeCanvasToDisplaySize(gl[i].canvas);
            gl[i].viewport(0, 0, gl[i].canvas.width, gl[i].canvas.height);
            gl[i].enable(gl[i].DEPTH_TEST);
        }
        

        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 0, 1];
        // Compute the camera's matrix using look at.
        const camerapos = [D*Math.sin(PHI)*Math.cos(THETA),
                            D*Math.sin(PHI)*Math.sin(THETA),
                            D*Math.cos(PHI)];
        // const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const camera = m4.lookAt(camerapos, cameraTarget, up);

        // Make a view matrix from the camera matrix.
        const view = m4.inverse(camera);

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: camerapos,
            u_shininess: shininess,
        };

        // compute the world matrix once since all parts
        // are at the same space.
        let u_world = m4.multiply(m4.yRotation(posY), m4.xRotation(posX));
        // console.log(u_world);
        u_world = m4.translate(u_world, ...objOffset);

        for(let i=0; i<canvas.length; i++){
            gl[i].useProgram(meshProgramInfo[i].program);

            // calls gl.uniform
            webglUtils.setUniforms(meshProgramInfo[i], sharedUniforms);

            for (const {bufferInfo, material} of parts[i]) {
                // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
                webglUtils.setBuffersAndAttributes(gl[i], meshProgramInfo[i], bufferInfo);
                // calls gl.uniform
                webglUtils.setUniforms(meshProgramInfo[i], {
                    u_world
                }, material);
                // calls gl.drawArrays or gl.drawElements
                webglUtils.drawBufferInfo(gl[i], bufferInfo);
            }
        }

        requestAnimationFrame(render);
    }

    var mouseDown = function(e) {
        drag=true;
        old_x=e.pageX, old_y=e.pageY;
        e.preventDefault();
        return false;
    };

    var mouseUp = function(e){
       drag=false;
    };

    var mouseMove = function(e) {
        if (!drag) return false; 
            dX =- (e.pageX-old_x) * 2 * Math.PI / canvas.width; 
            dY =- (e.pageY-old_y) * 2 * Math.PI / canvas.height; 
            THETA += dX;
        if (PHI + dY >= 0 && PHI + dY <= Math.PI)
            PHI += dY;
        old_x=e.pageX, old_y=e.pageY; 
        e.preventDefault();
    };

    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    canvas.mouseout = mouseUp;
    canvas.onmousemove = mouseMove;

    canvas.onwheel = function(event){
        if(event.deltaY < 0){
            D = D - 0.1 * D;
        }else{
            D = D + 0.1 * D;
        }
    }

    document.addEventListener('keydown', function(event) {
        if(event.keyCode == 65){
            // A
            posY = posY - 0.3;
        }else if(event.keyCode == 68){
            // D
            posY = posY + 0.3; 
        }else if(event.keyCode == 87){
            // W
            posX = posX - 0.3;
        }else if(event.keyCode == 83){
            // S
            posX = posX + 0.3;
        }else if(event.keyCode == 38){
            // UP
            shininess = shininess + 10;
        }else if(event.keyCode == 40){
            // DOWN
            shininess = shininess - 10;
        }
    });

    render();
}

main();
