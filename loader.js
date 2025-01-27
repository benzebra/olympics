// "use strict";
// const objArray = [
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj", 
//     "models/logo/model.obj"
// ];

// function parseOBJ(text) {
//     because indices are base 1 let's just fill in the 0th data
//     const objPositions = [[0, 0, 0]];
//     const objTexcoords = [[0, 0]];
//     const objNormals = [[0, 0, 0]];
//     const objColors = [[0, 0, 0]];

//     same order as `f` indices
//     const objVertexData = [
//         objPositions,
//         objTexcoords,
//         objNormals,
//         objColors,
//     ];

//     same order as `f` indices
//     let webglVertexData = [
//         [],   // positions
//         [],   // texcoords
//         [],   // normals
//         [],   // colors
//     ];

//     const materialLibs = [];
//     const geometries = [];
//     let geometry;
//     let groups = ['default'];
//     let material = 'default';
//     let object = 'default';

//     const noop = () => {};

//     function newGeometry() {
//         If there is an existing geometry and it's
//         not empty then start a new one.
//         if (geometry && geometry.data.position.length) {
//             geometry = undefined;
//         }
//     }

//     function setGeometry() {
//         if (!geometry) {
//             const position = [];
//             const texcoord = [];
//             const normal = [];
//             const color = [];
//             webglVertexData = [
//                 position,
//                 texcoord,
//                 normal,
//                 color,
//             ];
//             geometry = {
//                 object,
//                 groups,
//                 material,
//                 data: {
//                     position,
//                     texcoord,
//                     normal,
//                     color,
//                 },
//             };
//             geometries.push(geometry);
//         }
//     }

//     function addVertex(vert) {
//         const ptn = vert.split('/');
//         ptn.forEach((objIndexStr, i) => {
//             if (!objIndexStr) {
//                 return;
//             }
//             const objIndex = parseInt(objIndexStr);
//             const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
//             webglVertexData[i].push(...objVertexData[i][index]);
//             if this is the position index (index 0) and we parsed
//             vertex colors then copy the vertex colors to the webgl vertex color data
//             if (i === 0 && objColors.length > 1) {
//                 geometry.data.color.push(...objColors[index]);
//             }
//         });
//     }

//     const keywords = {
//         v(parts) {
//             if there are more than 3 values here they are vertex colors
//             if (parts.length > 3) {
//                 objPositions.push(parts.slice(0, 3).map(parseFloat));
//                 objColors.push(parts.slice(3).map(parseFloat));
//             } else {
//                 objPositions.push(parts.map(parseFloat));
//             }
//         },
//         vn(parts) {
//             objNormals.push(parts.map(parseFloat));
//         },
//         vt(parts) {
//             should check for missing v and extra w?
//             objTexcoords.push(parts.map(parseFloat));
//         },
//         f(parts) {
//             setGeometry();
//             const numTriangles = parts.length - 2;
//             for (let tri = 0; tri < numTriangles; ++tri) {
//                 addVertex(parts[0]);
//                 addVertex(parts[tri + 1]);
//                 addVertex(parts[tri + 2]);
//             }
//         },
//         s: noop,    // smoothing group
//         mtllib(parts, unparsedArgs) {
//             the spec says there can be multiple filenames here
//             but many exist with spaces in a single filename
//             materialLibs.push(unparsedArgs);
//         },
//         usemtl(parts, unparsedArgs) {
//             material = unparsedArgs;
//             newGeometry();
//         },
//         g(parts) {
//             groups = parts;
//             newGeometry();
//         },
//         o(parts, unparsedArgs) {
//             object = unparsedArgs;
//             newGeometry();
//         },
//     };

//     const keywordRE = /(\w*)(?: )*(.*)/;
//     const lines = text.split('\n');
//     for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
//         const line = lines[lineNo].trim();
//         if (line === '' || line.startsWith('#')) {
//             continue;
//         }
//         const m = keywordRE.exec(line);
//         if (!m) {
//             continue;
//         }
//         const [, keyword, unparsedArgs] = m;
//         const parts = line.split(/\s+/).slice(1);
//         const handler = keywords[keyword];
//         if (!handler) {
//             console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
//             continue;
//         }
//         handler(parts, unparsedArgs);
//     }

//     remove any arrays that have no entries.
//     for (const geometry of geometries) {
//         geometry.data = Object.fromEntries(
//             Object.entries(geometry.data).filter(([, array]) => array.length > 0));
//     }

//     return {
//         geometries,
//         materialLibs,
//     };
// }

// function parseMapArgs(unparsedArgs) {
//     // TODO: handle options
//     return unparsedArgs;
// }

// function parseMTL(text) {
//     const materials = {};
//     let material;

//     const keywords = {
//         newmtl(parts, unparsedArgs) {
//             material = {};
//             materials[unparsedArgs] = material;
//         },
//         /* eslint brace-style:0 */
//         Ns(parts)       { material.shininess      = parseFloat(parts[0]); },
//         Ka(parts)       { material.ambient        = parts.map(parseFloat); },
//         Kd(parts)       { material.diffuse        = parts.map(parseFloat); },
//         Ks(parts)       { material.specular       = parts.map(parseFloat); },
//         Ke(parts)       { material.emissive       = parts.map(parseFloat); },
//         map_Kd(parts, unparsedArgs)   { material.diffuseMap = parseMapArgs(unparsedArgs); },
//         map_Ns(parts, unparsedArgs)   { material.specularMap = parseMapArgs(unparsedArgs); },
//         map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
//         Ni(parts)       { material.opticalDensity = parseFloat(parts[0]); },
//         d(parts)        { material.opacity        = parseFloat(parts[0]); },
//         illum(parts)    { material.illum          = parseInt(parts[0]); },
//     };

//     const keywordRE = /(\w*)(?: )*(.*)/;
//     const lines = text.split('\n');
//     for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
//         const line = lines[lineNo].trim();
//         if (line === '' || line.startsWith('#')) {
//             continue;
//         }
//         const m = keywordRE.exec(line);
//         if (!m) {
//             continue;
//         }
//         const [, keyword, unparsedArgs] = m;
//         const parts = line.split(/\s+/).slice(1);
//         const handler = keywords[keyword];
//         if (!handler) {
//             console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
//             continue;
//         }
//         handler(parts, unparsedArgs);
//     }

//     return materials;
// }

// function isPowerOf2(value) {
//     return (value & (value - 1)) === 0;
// }

// function create1PixelTexture(gl, pixel) {
//     const texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
//                     new Uint8Array(pixel));
//     return texture;
// }

// function createTexture(gl, url) {
//     const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
//     // Asynchronously load an image
//     const image = new Image();
//     image.src = url;
//     image.addEventListener('load', function() {
//         // Now that the image has loaded make copy it to the texture.
//         gl.bindTexture(gl.TEXTURE_2D, texture);
//         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

//         // Check if the image is a power of 2 in both dimensions.
//         if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
//             // Yes, it's a power of 2. Generate mips.
//             gl.generateMipmap(gl.TEXTURE_2D);
//         } else {
//             // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//         }
//     });
//     return texture;
// }

// async function main(canvas, objUrl){

let stringIntro = "res/models/";

let posX=0, posY=0;
let D = 6;
let drag = false;
let old_x, old_y;
let dX=0, dY=0;
let shininess = 400;

let objArray = [
    // 0-9 MEDALS
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_sail.obj", 
    // 10 LOGO
    "logo_2024/logo.obj",
    // 11-20 OBJECTS
    "volley/volley.obj",
    "bike/bike.obj",
    "sail/sail.obj",
    "gun/gun.obj",
    "gym/gym.obj",
    "tennis/tennis.obj",
    "judo/judo.obj",
    "kayak/kayak.obj",
    "sword/sword.obj",
    "swim/swim.obj"
];


async function main(objIndex, gl, meshProgramInfo, freeMoving, canvas){
    const objHref = stringIntro + objArray[objIndex]; 
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
        defaultNormal: create1PixelTexture(gl, [127, 127, 255, 0]),
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
        normalMap: textures.defaultNormal,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        specularMap: textures.defaultWhite,
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

        // generate tangents if we have the data to do so.
        if (data.texcoord && data.normal) {
            data.tangent = generateTangents(data.position, data.texcoord);
        } else {
            // There are no tangents
            data.tangent = { value: [1, 0, 0] };
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
    const radius = m4.length(range) * 1.5;
    // if(freeMoving == false){
    let cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);
    // }
    
    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    if(freeMoving == true){
        var THETA = degToRad(20), PHI = degToRad(80);
    }

    function render(time) {
        time *= 0.001;  // convert to seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        const up = [0, 1, 0];
        if(freeMoving == true){
            cameraPosition = [D * Math.sin(PHI) * Math.cos(THETA),
                                D * Math.sin(PHI) * Math.sin(THETA),
                                D * Math.cos(PHI)];
        }
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            shininessAmbient: 100,
            Ka: 0.1,
            Kd: 0.9,
            Ks: 0.7,
            // diffuseColor: [1.0, 1.0, 1.0],
            // ambientColor: [0.0, 0.0, 0.0],
            // specularColor: [0.5, 0.0, 1.0],
            diffuse: [1.0,1.0,1.0],
            lightPos: [0.0, 8.0, 10.0],
        };

        gl.useProgram(meshProgramInfo.program);

        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        let u_world = m4.yRotation(time);
        if(freeMoving == true){
            u_world = m4.multiply(m4.yRotation(posY), m4.xRotation(posX));
        }
        // let u_world = m4.identity();
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

    if(freeMoving == true){
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
    
    }
}
