"use strict";

const vs = `
    attribute vec3 a_position;
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
    varying vec3 vertPos;

    void main() {
        vec4 vertPos4 = u_world * vec4(a_position, 1.0); 
        vertPos = vec3(vertPos4) / vertPos4.w;            
        v_normal = vec3(u_world * vec4(a_normal, 0.0));   
        gl_Position = u_projection * u_view * vertPos4;   
        v_texcoord = a_texcoord;
        v_color = a_color;
    }`;

const fs = `
    precision highp float;
  
    varying vec3 v_normal;
    varying vec3 v_surfaceToView;
    varying vec3 vertPos;
    varying vec2 v_texcoord;
    varying vec4 v_color;
  
    uniform vec3 lightPos;
    uniform vec3 u_ambientLight;
    uniform float shininessAmbient;
    
    uniform vec3 diffuse;
    uniform vec3 ambient;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;
  
    uniform float Ka;
    uniform float Kd;
    uniform float Ks;
  
    uniform int mode;
  
    uniform sampler2D diffuseMap;
    uniform sampler2D specularMap;
  
    void main () {
        vec3 N = normalize(v_normal);
        vec3 L = normalize(lightPos - vertPos);
        float lambertian = max(dot(N, L), 0.0);
        float specularLight = 0.0;
    
        if (lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(-vertPos); // Vector to viewer
            float specAngle = max(dot(R, V), 0.0);
            specularLight = pow(specAngle, shininessAmbient);
        }
    
        vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
        vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
    
        vec4 specularMapColor = texture2D(specularMap, v_texcoord);
        vec3 effectiveSpecular = specularMapColor.rgb * specularLight * specular;
    
        gl_FragColor = vec4(
            Ka * ambient + 
            Kd * lambertian * effectiveDiffuse + 
            Ks * effectiveSpecular + emissive, 
            diffuseMapColor.a * v_color.a * opacity 
        );
    }`;

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
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    const keywords = {
        v(parts) {
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
        s: noop,
        mtllib(parts, unparsedArgs) {
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
            console.warn('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }

    // remove any arrays that have no entries
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

    return unparsedArgs;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixel));
    return texture;
}

function createTexture(gl, url) {
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });
    return texture;
}

function makeIndexIterator(indices) {
    let ndx = 0;
    const fn = () => indices[ndx++];
    fn.reset = () => { ndx = 0; };
    fn.numElements = indices.length;
    return fn;
}
  
function makeUnindexedIterator(positions) {
    let ndx = 0;
    const fn = () => ndx++;
    fn.reset = () => { ndx = 0; };
    fn.numElements = positions.length / 3;
    return fn;
}
  
const subtractVector2 = (a, b) => a.map((v, ndx) => v - b[ndx]);

function generateTangents(position, texcoord, indices) {
    const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
    const numFaceVerts = getNextIndex.numElements;
    const numFaces = numFaceVerts / 3;
  
    const tangents = [];
    for (let i = 0; i < numFaces; ++i) {
      const n1 = getNextIndex();
      const n2 = getNextIndex();
      const n3 = getNextIndex();
  
      const p1 = position.slice(n1 * 3, n1 * 3 + 3);
      const p2 = position.slice(n2 * 3, n2 * 3 + 3);
      const p3 = position.slice(n3 * 3, n3 * 3 + 3);
  
      const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
      const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
      const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);
  
      const dp12 = m4.subtractVectors(p2, p1);
      const dp13 = m4.subtractVectors(p3, p1);
  
      const duv12 = subtractVector2(uv2, uv1);
      const duv13 = subtractVector2(uv3, uv1);
  
      const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);
      const tangent = Number.isFinite(f)
        ? m4.normalize(m4.scaleVector(m4.subtractVectors(
            m4.scaleVector(dp12, duv13[1]),
            m4.scaleVector(dp13, duv12[1]),
          ), f))
        : [1, 0, 0];
  
      tangents.push(...tangent, ...tangent, ...tangent);
    }
  
    return tangents;
}

async function loadContent(url){
    try {
        const response = await fetch(url + "?please-dont-cache=" + Math.random());
        if (!response.ok) {
            throw new Error(
                `Error: HTTP Status ${response.status} on resource ${url}`
            );
        }
        document.getElementById("article").innerHTML = await response.text();
    } catch (error) {
        throw new Error(error.message);
    }
}