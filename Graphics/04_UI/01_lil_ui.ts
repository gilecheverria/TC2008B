/*
 * Script to draw a 2D shape using WebGL
 * Testing the lil-gui library for the user interface
 * The twgl and lil-gui libraries are installed with npm
 *
 * Gilberto Echeverria
 * 2024-07-17
 */


'use strict';

import * as twgl from 'twgl-base.js';
import { shapeF, shapeF_centered } from '../libs/shapes.js';
import GUI from 'lil-gui';
import { V2, M3 } from '../libs/2d-lib.js';

/*
// Define the shader code, using GLSL 3.00

const vsGLSL = `#version 300 es
in vec2 a_position;

uniform mat3 u_transforms;
uniform vec2 u_resolution;

void main() {
    // Transformed position
    vec2 position = (u_transforms * vec3(a_position, 1)).xy;

    // Convert the position from pixels to 0.0 - 1.0
    vec2 zeroToOne = position / u_resolution;

    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Invert Y axis
    gl_Position = vec4(clipSpace, 0, 1);
    //gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const fsGLSL = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
    outColor = u_color;
}
`;
*/


// Import the shaders from external files
import vsGLSL from './vs_matrices_2D.glsl?raw';
import fsGLSL from './fs_flat_color.glsl?raw';

// Global variables
let programInfo : twgl.ProgramInfo = undefined;
let bufferInfo : twgl.BufferInfo = undefined;
let arrays : twgl.Arrays = undefined;
let vao : WebGLVertexArrayObject;

// Variable with the data for the object transforms, controlled by the UI
const object = {
    // Translation
    t: {
        x: 200,
        y: 300,
        z: 0},
    // Rotation in radians
    rr: {
        x: 0,
        y: 0,
        z: 0},
    // Scale
    s: {
        x: 0.7,
        y: 1.6,
        z: 1.0},
    color: [
        Math.random(),
        Math.random(),
        Math.random(),
        1],
}

function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    arrays = shapeF_centered();
    //arrays = shapeF();

    bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

    setupUI(gl);

    drawScene(gl);
}

// Function to do the actual display of the objects
function drawScene(gl: WebGL2RenderingContext): void {
    // Convert the global values into vectors
    let v2_trans = V2.create(object.t.x, object.t.y);
    let v2_scale = V2.create(object.s.x, object.s.y);

    // Create a composite transform matrix
    let translateMatrix = M3.translation(v2_trans);
    let rotateMatrix = M3.rotation(object.rr.z);
    let scaleMatrix = M3.scale(v2_scale);

    let transforms = M3.identity();
    transforms = M3.multiply(scaleMatrix, transforms);
    transforms = M3.multiply(rotateMatrix, transforms);
    transforms = M3.multiply(translateMatrix, transforms);

    let uniforms =
        {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_transforms: transforms,
            u_color: object.color,
        }
    //console.log("UNIFORMS:");
    //console.log(uniforms);

    gl.useProgram(programInfo.program);

    twgl.setUniforms(programInfo, uniforms);

    gl.bindVertexArray(vao);

    //twgl.drawBufferInfo(gl, bufferInfo, gl.LINE_STRIP);
    twgl.drawBufferInfo(gl, bufferInfo);

    requestAnimationFrame(() => drawScene(gl));
}

function setupUI(gl : WebGLRenderingContext): void {
    // Create the UI elements for each value
    const gui = new GUI();

    const traFolder = gui.addFolder('Translation');
    traFolder.add( object.t, 'x', 0, gl.canvas.width)
        .onChange( (value : number) => {
            object.t.x = value;
        });
    traFolder.add( object.t, 'y', 0, gl.canvas.height)
        .onChange( (value : number) => {
            object.t.y = value;
        });
    const rotFolder = gui.addFolder('Rotation');
    rotFolder.add( object.rr, 'z', 0, Math.PI * 2)
        .onChange( (value : number) => {
            object.rr.z = value;
        });
    const scaFolder = gui.addFolder('Scale');
    scaFolder.add( object.s, 'x', -5, 5)
        .onChange( (value : number) => {
            object.s.x = value;
        });
    scaFolder.add( object.s, 'y', -5, 5)
        .onChange( (value : number) => {
            object.s.y = value;
        });
    const colorFolder = gui.addFolder('Color');
    colorFolder.addColor( object, 'color')
        .onChange( (value : number[]) => {
            object.color = value;
        });
}

main()
