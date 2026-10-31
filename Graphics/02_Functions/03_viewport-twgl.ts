/*
 * Script to draw a color polygon using WebGL 2 and TypeScript
 * Using viewport transforms to provide coordinates in different reference space
 *
 * Gilberto Echeverria
 * 2026-07-13
 */

'use strict';

import * as twgl from 'twgl-base.js';

// Vertex Shader as a string
const vsGLSL = `#version 300 es
in vec2 a_position;
in vec4 a_color;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
    // Convert the position from pixels to 0.0 - 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Set the final position for the vertex
    gl_Position = vec4(clipSpace, 0, 1);

    // Pass the color to the fragment shader
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

    const sides = 5;
    const centerX = 600;
    const centerY = 300;
    const radius = 200;

    // Create a polygon with the center at a specific location
    const arrays = generateData(sides, centerX, centerY, radius);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

    drawScene(gl, vao, programInfo, bufferInfo);
}

// Function to do the actual display of the objects
function drawScene(
    gl: WebGL2RenderingContext,
    vao: WebGLVertexArrayObject,
    programInfo: twgl.ProgramInfo,
    bufferInfo: twgl.BufferInfo,
): void {
    twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const uniforms = {
        u_resolution: [gl.canvas.width, gl.canvas.height],
    };

    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, uniforms);

    console.log(vao);

    gl.bindVertexArray(vao);
    twgl.drawBufferInfo(gl, bufferInfo);
}

// Create the data for the vertices of the polygon, as an object with two arrays
function generateData(
    sides: number,
    centerX: number,
    centerY: number,
    radius: number,
): twgl.Arrays {
    // The arrays are initially empty
    const positionData: number[] = [];
    const colorData: number[] = [];
    const indexData: number[] = [];

    // Initialize the center vertex, at the origin and with white color
    positionData.push(centerX);
    positionData.push(centerY);
    colorData.push(1);
    colorData.push(1);
    colorData.push(1);
    colorData.push(1);

    const angleStep = 2 * Math.PI / sides;

    // Loop over the sides to create the rest of the vertices
    for (let s = 0; s < sides; s++) {
        const angle = angleStep * s;

        // Generate the coordinates of the vertex
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
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
