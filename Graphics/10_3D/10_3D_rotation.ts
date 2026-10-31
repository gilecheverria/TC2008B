/*
 * Script to draw a cube in 3D
 * Using twgl for transforms and boilerplate functions
 * The twgl and lil-gui libraries are installed with npm
 *
 * Gilberto Echeverria
 * 2024-07-12
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { V3, M4 } from '../libs/3d-lib.js';
import { cubeFaceColors, cubeVertexColors } from '../libs/shapes';
import { loadObj } from '../libs/obj_loader';

import wheelString from './../assets/models/wheel.obj?raw';

// Define the shader code, using GLSL 3.00

const vsGLSL = `#version 300 es
in vec4 a_position;
in vec4 a_color;

uniform mat4 u_transforms;

out vec4 v_color;

void main() {
    gl_Position = u_transforms * a_position;
    v_color = a_color;
}
`;

const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

// Global variables
let programInfo = undefined;

const objects = {
    pivot: {
        transforms: {
            // Translation
            t: {
                x: 0,
                y: 0,
                z: 0},
            // Rotation in radians
            rr: {
                x: 0,
                y: 0,
                z: 0},
            // Scale
            s: {
                x: 1.0,
                y: 1.0,
                z: 1.0},
        },
        arrays: undefined,
        bufferInfo: undefined,
        vao: undefined,
    },

    model: {
        transforms: {
            // Translation
            t: {
                x: 0,
                y: 0,
                z: 0},
            // Rotation in degrees
            rd: {
                x: 0,
                y: 0,
                z: 0},
            // Rotation in radians
            rr: {
                x: 0,
                y: 0,
                z: 0},
            // Scale
            s: {
                x: 1.0,
                y: 1.0,
                z: 1.0},
        },
        arrays: undefined,
        bufferInfo: undefined,
        vao: undefined,
    },
}

function main() {

    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');

    setupUI(gl);

    programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    // Larger cube (model)
    //objects.model.arrays = cubeFaceColors(2);
    objects.model.arrays = loadObj(wheelString);
    objects.model.bufferInfo = twgl.createBufferInfoFromArrays(gl, objects.model.arrays);
    objects.model.vao = twgl.createVAOFromBufferInfo(gl, programInfo, objects.model.bufferInfo);

    // Smaller cube (pivot)
    objects.pivot.arrays = cubeVertexColors(2);
    objects.pivot.bufferInfo = twgl.createBufferInfoFromArrays(gl, objects.pivot.arrays);
    objects.pivot.vao = twgl.createVAOFromBufferInfo(gl, programInfo, objects.pivot.bufferInfo);

    drawScene(gl);
}

// Function to do the actual display of the objects
function drawScene(gl) {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(programInfo.program);

    const viewProjectionMatrix = setupWorldView(gl);

    let composite = undefined;
    let uniforms = undefined;

    // Draw the model
    composite = transformModel(viewProjectionMatrix);
    uniforms = {
        u_transforms: composite,
    }
    twgl.setUniforms(programInfo, uniforms);
    gl.bindVertexArray(objects.model.vao);
    twgl.drawBufferInfo(gl, objects.model.bufferInfo);

    // Draw the pivot
    composite = transformPivot(viewProjectionMatrix);
    uniforms = {
        u_transforms: composite,
    }
    twgl.setUniforms(programInfo, uniforms);
    gl.bindVertexArray(objects.pivot.vao);
    twgl.drawBufferInfo(gl, objects.pivot.bufferInfo);

    requestAnimationFrame(() => drawScene(gl));
}

function transformModel(viewProjectionMatrix) {
    // Convert the global values into twgl vectors
    const v3_trans = V3.create(objects.model.transforms.t.x,
                             objects.model.transforms.t.y,
                             objects.model.transforms.t.z);
    const v3_scale = V3.create(objects.model.transforms.s.x,
                             objects.model.transforms.s.y,
                             objects.model.transforms.s.z);
    // The pivot position
    const v3_center_to_pivot = V3.create(objects.pivot.transforms.t.x,
                                         objects.pivot.transforms.t.y,
                                         objects.pivot.transforms.t.z);
    const v3_pivot_to_center = V3.create(-objects.pivot.transforms.t.x,
                                         -objects.pivot.transforms.t.y,
                                         -objects.pivot.transforms.t.z);

    // Matrices for the pivot point
    const pivotToCenterMat = M4.translation(v3_pivot_to_center);
    const centerToPivotMat = M4.translation(v3_center_to_pivot);

    // Matrices for the object transforms
    const traMat = M4.translation(v3_trans);
    const rotXMat = M4.rotationX(objects.model.transforms.rr.x);
    const rotYMat = M4.rotationY(objects.model.transforms.rr.y);
    const rotZMat = M4.rotationZ(objects.model.transforms.rr.z);
    const scaMat = M4.scale(v3_scale);

    let composite = M4.identity();
    // In order of application
    composite = M4.multiply(scaMat, composite);
    composite = M4.multiply(traMat, composite);
    composite = M4.multiply(pivotToCenterMat, composite);
    composite = M4.multiply(rotXMat, composite);
    composite = M4.multiply(rotYMat, composite);
    composite = M4.multiply(rotZMat, composite);
    composite = M4.multiply(centerToPivotMat, composite);
    composite = M4.multiply(viewProjectionMatrix, composite);
    /*
    // In reverse order of application
    composite = M4.multiply(composite, viewProjectionMatrix);
    composite = M4.multiply(composite, traMat);
    composite = M4.multiply(composite, rotXMat);
    composite = M4.multiply(composite, rotYMat);
    composite = M4.multiply(composite, rotZMat);
    composite = M4.multiply(composite, scaMat);
    */

    return composite;
}

function transformPivot(viewProjectionMatrix) {
    // PIVOT model
    // Hardcoded scale for the pivot
    const v3_scale_pivot = V3.create(0.1, 0.1, 0.1);
    const v3_trans_pivot = V3.create(objects.pivot.transforms.t.x,
                                     objects.pivot.transforms.t.y,
                                     objects.pivot.transforms.t.z);

    const pivotScaleMat = M4.scale(v3_scale_pivot);
    const pivotTransMat = M4.translation(v3_trans_pivot);

    let composite = M4.identity();
    composite = M4.multiply(pivotScaleMat, composite);
    composite = M4.multiply(pivotTransMat, composite);
    composite = M4.multiply(viewProjectionMatrix, composite);

    return composite;
}

function setupWorldView(gl) {
    // Field of view of 60 degrees, in radians
    const fov = 60 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    // Matrices for the world view
    const projectionMatrix = M4.perspective(fov, aspect, 1, 200);

    const cameraPosition = [0, 0, 10];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = M4.lookAt(cameraPosition, target, up);
    //console.log(cameraMatrix);

    const viewMatrix = M4.inverse(cameraMatrix);

    const viewProjectionMatrix = M4.multiply(projectionMatrix, viewMatrix);
    return viewProjectionMatrix;
}

// Setup a ui.
function setupUI(gl) {
    // Create the UI elements for each value
    const gui = new GUI();

    const modelFolder = gui.addFolder('Model');
    const posFolder = modelFolder.addFolder('Position:');
    posFolder.add( objects.model.transforms.t, 'x', -5, 5)
        .onChange( value => {
            objects.model.transforms.t.x = value;
        });
    posFolder.add( objects.model.transforms.t, 'y', -5, 5)
        .onChange( value => {
            objects.model.transforms.t.y = value;
        });
    posFolder.add( objects.model.transforms.t, 'z', -5, 5)
        .onChange( value => {
            objects.model.transforms.t.z = value;
        });
    const rotFolder = modelFolder.addFolder('Rotation:')
    rotFolder.add( objects.model.transforms.rd, 'x', 0, 360)
        .onChange( value => {
            objects.model.transforms.rd.x = value;
            objects.model.transforms.rr.x = objects.model.transforms.rd.x * Math.PI / 180;
        });
    rotFolder.add( objects.model.transforms.rd, 'y', 0, 360)
        .onChange( value => {
            objects.model.transforms.rd.y = value;
            objects.model.transforms.rr.y = objects.model.transforms.rd.y * Math.PI / 180;
        });
    rotFolder.add( objects.model.transforms.rd, 'z', 0, 360)
        .onChange( value => {
            objects.model.transforms.rd.z = value;
            objects.model.transforms.rr.z = objects.model.transforms.rd.z * Math.PI / 180;
        });
    const scaFolder = modelFolder.addFolder('Scale:')
    scaFolder.add( objects.model.transforms.s, 'x', -5, 5)
        .onChange( value => {
            objects.model.transforms.s.x = value;
        });
    scaFolder.add( objects.model.transforms.s, 'y', -5, 5)
        .onChange( value => {
            objects.model.transforms.s.y = value;
        });
    scaFolder.add( objects.model.transforms.s, 'z', -5, 5)
        .onChange( value => {
            objects.model.transforms.s.z = value;
        });

    const pivotFolder = gui.addFolder('Pivot');
    const posFolderPivot = pivotFolder.addFolder('Position:');
    posFolderPivot.add( objects.pivot.transforms.t, 'x', -5, 5)
        .onChange( value => {
            objects.pivot.transforms.t.x = value;
        });
    posFolderPivot.add( objects.pivot.transforms.t, 'y', -5, 5)
        .onChange( value => {
            objects.pivot.transforms.t.y = value;
        });
    posFolderPivot.add( objects.pivot.transforms.t, 'z', -5, 5)
        .onChange( value => {
            objects.pivot.transforms.t.z = value;
        });
}

main()
