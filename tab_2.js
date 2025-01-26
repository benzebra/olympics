"use strict";

const vs = `
    varying vec2 v_texcoord;
    varying vec3 v_color;

    attribute vec4 a_position;
    attribute vec3 a_normal;
    uniform mat4 u_projection, u_view, u_world;
    varying vec3 v_normal;
    varying vec3 vertPos;

    attribute vec2 a_texcoord;
    attribute vec4 a_color;
    attribute vec3 a_tangent;

    varying vec3 v_tangent;

    void main(){
        vec4 vertPos4 = u_view * u_world * a_position;
        vertPos = vec3(vertPos4) / vertPos4.w;

        mat3 normalMat = mat3(u_world);
        v_normal = normalize(normalMat * a_normal);
        v_tangent = normalize(normalMat * a_tangent);

        gl_Position = u_projection * u_view * u_world * a_position;

        v_texcoord = a_texcoord;
        v_color = a_color.rgb;
    }
    `;

const fs = `
    precision highp float;

    varying vec3 v_normal;          // normalInterp
    // varying vec3 v_surfaceToView;
    varying vec3 vertPos;           // Vertex position
    
    varying vec2 v_texcoord;    
    varying vec4 v_color;

    //todo
    uniform sampler2D diffuseMap;
    uniform sampler2D specularMap;

    // set by parseMTL
    uniform vec3 diffuse;           // diffuseColor
    uniform vec3 ambient;           // ambientColor
    uniform vec3 specular;          // specularColor
    uniform float shininess;      // shininessVal

    // set by ME
    uniform vec3 diffuseColor;           // diffuseColor
    uniform vec3 ambientColor;           // ambientColor
    uniform vec3 specularColor;          // specularColor
    uniform float u_shininess;      // shininessVal
    
    // added
    uniform vec3 lightPos; // Light position
    uniform float Ka;   // Ambient reflection coefficient
    uniform float Kd;   // Diffuse reflection coefficient
    uniform float Ks;   // Specular reflection coefficient

    // inutili
    uniform float opacity;          // opacityVal ?? - da togliere (phong non ha opacity ma 1.0)
    uniform vec3 u_lightDirection;  
    uniform vec3 u_ambientLight;   
    uniform vec3 emissive;          // emissiveColor ?? - da togliere

    // to add ?
    // uniform int mode;

    varying vec3 v_tangent;
    uniform sampler2D normalMap;


    void main () {
        vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );

        vec3 tangent = normalize(v_tangent);
        vec3 bitangent = normalize(cross(v_normal, tangent));
        
        mat3 tbn = mat3(tangent, bitangent, normal);
        normal = texture2D(normalMap, v_texcoord).rgb * 2. - 1.;
        normal = normalize(tbn * normal);

        // vec3 normal = normalize(v_normal);
        vec3 N = normalize(v_normal);
        vec3 L = normalize(lightPos - vertPos);

        float lambertian = max(dot(N, L), 0.0);
        float specularLight = 0.0;
        if(lambertian > 0.0){
            vec3 R = reflect(-L, N);
            vec3 V = normalize(-vertPos);
            float specAngle = max(dot(R, V), 0.0);
            specularLight = pow(specAngle, shininess);
        }

        vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
        vec3 effectiveDiffuse = diffuseColor * diffuseMapColor.rgb;
        // float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

        vec4 specularMapColor = texture2D(specularMap, v_texcoord);
        vec3 effectiveSpecular = (specularColor * specularMapColor.rgb) * specularLight;

        gl_FragColor = vec4(emissive+
                            Ka * ambientColor +
                            Kd * lambertian * effectiveDiffuse +
                            Ks * effectiveSpecular, 1.0);
    }
`;


let objArray = [
    "models/logo/model.obj", 
    "models/logo_2024/logo.obj", 
    "models/tennis/tennis.obj", 
    "models/volley/volley.obj", 
    "models/logo_2024/logo.obj", 
    "models/logo/model.obj", 
    "models/logo/model.obj", 
    "models/logo/model.obj", 
    "models/logo/model.obj", 
    "models/logo/model.obj"
];

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

const canvas = document.getElementsByTagName("canvas");

for(let i=0; i<canvas.length; i++){
    let gl = canvas[i].getContext("webgl");        

    if(!gl){
        console.log("WebGL not supported, falling back on experimental-webgl");
        // gl = canvas[i].getContext("experimental-webgl");
    }

    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

    main(objArray[i], gl, meshProgramInfo, false, canvas[i]);
}