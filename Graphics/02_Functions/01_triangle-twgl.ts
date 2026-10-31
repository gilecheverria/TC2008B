/*
 * Script to draw a color triangle using WebGL 2 and TypeScript
 * Also using external functions from the TWGL library to boilerplate code
 *
 * Gilberto Echeverria
 * 2026-07-13
 */

import * as twgl from 'twgl-base.js';

// Vertex Shader as a string
const vsGLSL = `#version 300 es
in vec4 a_position;
in vec4 a_color;

out vec4 v_color;

void main() {
    gl_Position = a_position;
    v_color = a_color;
}
`;

// Fragment Shader as a string
const fsGLSL = `#version 300 es
precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
    outColor = v_color;
    //outColor = vec4(1, 0, 1, 1);
}
`;

function main_twgl(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);
    //console.log(programInfo.program);

    // Create an object that contains the arrays with the data
    // for each of the vertices
    const arrays = generateData();
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

    gl.bindVertexArray(vao);
    gl.useProgram(programInfo.program);

    // compute 3 vertices for 1 triangle
    twgl.drawBufferInfo(gl, bufferInfo);
}

// Create the data for the vertices and colors of the polygon
// Return an object with two arrays
function generateData(): twgl.Arrays {
    // The names of the arrays must be the same as the attributes used in the
    // shaders. In this case: a_position and a_color
    const arrays: twgl.Arrays = {
        a_position: {
            // Two components for the coordinates in X and Y
            numComponents: 2,
            data: new Float32Array([
                 0.0,   0.7,
                 0.5,  -0.7,
                -0.5,  -0.7,
            ]),
        },
        a_color: {
            // Four components for the color (RGBA)
            numComponents: 4,
            /*
            // If not type is indicated, twgl will assume a type of float
            data: [
                1, 0, 0, 1,
                0, 1, 0, 1,
                0, 0, 1, 1,
            ]
            */
            // To pass integer values, the type must be specified
            data: new Uint8Array([
                255, 0, 0, 255,
                0, 255, 0, 255,
                0, 0, 255, 255,
            ]),
        },
    };
    return arrays;
}

main_twgl();
