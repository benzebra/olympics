let stringIntro = "res/models/";

var controls = {
    D: 0,
    THETA: Math.PI,
    PHI: 0,
    Ka: 0.1,
    Kd: 0.9,
    Ks: 0.7,
    xLight: 0,
    yLight: 0,
    zLight: 0,
}

let drag = false;
let old_x, old_y;

let objArray = [
    // 0-9 MEDALS
    "medals/medal_volley.obj", 
    "medals/medal_bike.obj", 
    "medals/medal_sail.obj", 
    "medals/medal_gun.obj", 
    "medals/medal_gym.obj", 
    "medals/medal_tennis.obj", 
    "medals/medal_judo.obj", 
    "medals/medal_kayak.obj", 
    "medals/medal_sword.obj", 
    "medals/medal_swim.obj", 
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
    "swim/swim.obj",
    // 21 about me
    "medal_me/medal_me.obj",
];

let renderStatus = 0;
let numMaterials = 0;
let loadingStatus = 0;

function setNumMaterials(num) {
    numMaterials = num;
}

function getNumMaterials() {
    return numMaterials;
}

function setLoadingStatus(index) {
    loadingStatus = index/getNumMaterials();
}

function getLoadingStatus() {
    return loadingStatus;
}
// function createLoadingBar() {
//     const loadingBarContainer = document.createElement('div');
//     loadingBarContainer.style.position = 'fixed';
//     loadingBarContainer.style.top = '10px';
//     loadingBarContainer.style.left = '50%';
//     loadingBarContainer.style.transform = 'translateX(-50%)';
//     loadingBarContainer.style.width = '80%';
//     loadingBarContainer.style.height = '20px';
//     loadingBarContainer.style.backgroundColor = '#ccc';
//     loadingBarContainer.style.borderRadius = '10px';
//     loadingBarContainer.style.overflow = 'hidden';
//     loadingBarContainer.style.zIndex = '1000';

//     const loadingBar = document.createElement('div');
//     loadingBar.style.height = '100%';
//     loadingBar.style.width = '0%';
//     loadingBar.style.backgroundColor = '#4caf50';
//     loadingBar.style.borderRadius = '10px';

//     loadingBarContainer.appendChild(loadingBar);
//     document.body.appendChild(loadingBarContainer);

//     return loadingBar;
// }

// const loadingBar = createLoadingBar();

// function updateLoadingBar() {
//     loadingBar.style.width = `${getLoadingStatus() * 100}%`;
// }

// setInterval(updateLoadingBar, 100);

function setRenderStatus(status, gl){
    renderStatus = status;
    glToMove = gl;
}

function getControls(){
    return controls;
}


async function main(objIndex, gl, meshProgramInfo, canvas) {

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
    setNumMaterials(Object.values(materials).length);

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

        const materialIndex = Object.values(materials).indexOf(material);
        setLoadingStatus(materialIndex + 1);
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
    const cameraTarget = [0, 1, 0];
    const radius = m4.length(range);
    let cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius * 1.3,
    ]);
    
    let zNear = radius / 100;
    let zFar = radius + 30; // radius + max(D)
    let lightPosVector = [0.0, 8.0, 10.0]; // standard value for index and tab pages

    if(renderStatus == 3){
        lightPosVector = [0, 0, -radius];
        controls.xLight = lightPosVector[0];
        controls.yLight = lightPosVector[1];
        controls.zLight = lightPosVector[2];
    }

    function render(time) {
        time *= 0.001;  // convert to seconds

        if(renderStatus == 2){
            time = time * 4;
        }

        if(renderStatus == 4){
            controls.D = 6;
        }

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        const up = [0, 1, 0];
        if(renderStatus == 3 | renderStatus == 4){
            cameraPosition = [
                (radius + controls.D) * Math.cos(controls.PHI) * Math.sin(controls.THETA),
                (radius + controls.D) * Math.sin(controls.PHI),
                (radius + controls.D) * Math.cos(controls.PHI) * Math.cos(controls.THETA),
              ];
        }
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);

        if(renderStatus == 3){
            lightPosVector = [controls.xLight, controls.yLight, controls.zLight];
        }else if(renderStatus == 4){
            lightPosVector = [10.0, 8.0, -10.0];
        }

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            shininessAmbient: 100,
            Ka: controls.Ka,
            Kd: controls.Kd,
            Ks: controls.Ks,
            diffuse: [1.0, 1.0, 1.0],
            lightPos: lightPosVector,
        };

        gl.useProgram(meshProgramInfo.program);

        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        let u_world;
        if((renderStatus == 1 && gl == glToMove)||(renderStatus == 2 && gl == glToMove)){
            u_world = m4.yRotation(time);
        }else{
            u_world = m4.identity();
        }

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