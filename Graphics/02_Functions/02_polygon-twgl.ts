/*
 * Script to draw a color polygon using WebGL 2 and TypeScript
 * Also using external functions from the TWGL library to boilerplate code
 *
 * Gilberto Echeverria
 * 2026-07-13
 */


'use strict';

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
}
`;

function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    const sides = 6;
    const arrays = generateData(sides);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);
    console.log(vao);

    gl.bindVertexArray(vao);
    gl.useProgram(programInfo.program);

    twgl.drawBufferInfo(gl, bufferInfo);
    //gl.drawElements(gl.TRIANGLES, bufferInfo.enumElements, gl.UNSIGNED_SHORT, 0);
}

// Create the data for the vertices of the polygon, as an object with two arrays
function generateData(sides: number): twgl.Arrays {
    // The arrays are initially empty
    const positionData: number[] = [];
    const colorData: number[] = [];
    const indexData: number[] = [];

    // Initialize the center vertex, at the origin and with white color
    positionData.push(0);
    positionData.push(0);
    colorData.push(1);
    colorData.push(1);
    colorData.push(1);
    colorData.push(1);

    const angleStep = 2 * Math.PI / sides;

    // Loop over the sides to create the rest of the vertices
    for (let s = 0; s < sides; s++) {
        const angle = angleStep * s;

        // Generate the coordinates of the vertex
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        positionData.push(x);
        positionData.push(y);

        // Generate a random color for the vertex
        colorData.push(Math.random());
        colorData.push(Math.random());
        colorData.push(Math.random());
        colorData.push(1);

        // Define the triangles, in counter clockwise order
        indexData.push(0);
        indexData.push(s + 1);
        indexData.push(((s + 2) <= sides) ? (s + 2) : 1);
    }

    const arrays: twgl.Arrays = {
        // Two components for each position in 2D
        a_position: { numComponents: 2, data: positionData },
        // Four components for a color (RGBA)
        a_color: { numComponents: 4, data: colorData },
        // Three components for each triangle, the 3 vertices
        indices: { numComponents: 3, data: indexData },
    };

    console.log(arrays);
    return arrays;
}

main();
