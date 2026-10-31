/*
 * Script to draw a complex shape in 2D
 * Adding scaling to the vertices of the object
 *
 * Gilberto Echeverria
 * 2024-07-12
 */


'use strict';

import * as twgl from 'twgl-base.js'
import { shapeF } from '../libs/shapes.js'

// Import the shaders from external files
import vsGLSL from './vs_03_scale.glsl?raw';
import fsGLSL from './fs_flat_color.glsl?raw';

function main() {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    const arrays = shapeF();

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
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Variable to define the translation of the object
    const translation = [240, 150];
    // Variables for the rotation
    const angleDegrees = 30;
    const angleRadians = angleDegrees * Math.PI / 180.0;
    const rotation = [Math.cos(angleRadians), Math.sin(angleRadians)];
    // Scale factors in X and Y
    const scale = [2.3, 0.6];

    let uniforms =
    {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_color: [Math.random(), Math.random(), Math.random(), 1],
        u_translation: translation,
        u_rotation: rotation,
        u_scale: scale,
    }
    console.log(uniforms);

    gl.useProgram(programInfo.program);

    twgl.setUniforms(programInfo, uniforms);

    //console.log(vao);

    gl.bindVertexArray(vao);

    twgl.drawBufferInfo(gl, bufferInfo);
}

main()
