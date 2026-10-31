/*
 * Base program for a 3D scene using the custom 3D library.
 * Using twgl for boilerplate functions.
 * The twgl and lil-gui libraries are installed with npm.
 *
 * Gilberto Echeverria
 * 2026-07-16
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, V3, type Mat4, type Vec3 } from '../libs/3d-lib';
import { Scene } from '../libs/scene.js';
import { Object3D } from '../libs/object3d.js';
import { cubeFaceColors } from '../libs/shapes.js';

// Define the shader code, using GLSL 3.00
import vsGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsGLSL from '../assets/shaders/fs_color.glsl?raw';

class CubeOneScene extends Scene {
    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);

        // Create the cube object for this scene
        const cube = this.addObject('cube', cubeFaceColors(1), [0.2, 0.6, 0.8, 1]);
    }

    drawObject(object: Object3D, viewProjectionMatrix: Mat4): void {
        // Get the WebGL context and program info
        const { gl, programInfo } = this;

        // Prepare the vector for translation and scale
        // TODO: Assign the correct values for translation and scale from the object properties
        let v3_tra: Vec3 = [];
        let v3_sca: Vec3 = [];

        // Create the individual transform matrices
        // TODO: Create matrices for each of the transformations




        // Create the composite matrix with all transformations
        // TODO: Create a single transformation matrix that combines all the individual transformations
        let transforms: Mat4 = M4.identity();




        //object.matrix = transforms;

        // Apply the projection to the final matrix for the
        // World-View-Projection
        const wvpMat: Mat4 = M4.multiply(viewProjectionMatrix, transforms);

        let uniforms = {
            u_worldViewProjection: wvpMat,
        }

        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(object.vao);
        twgl.drawBufferInfo(gl, object.bufferInfo);
        //twgl.drawBufferInfo(gl, object.bufferInfo, gl.LINES);
    }

    // Function to do the actual display of the objects
    render(): void {
        const { gl, programInfo } = this;

        // Clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // tell webgl to cull faces
        gl.enable(gl.CULL_FACE);

        gl.useProgram(programInfo.program);

        const viewProjectionMatrix = this.setupViewProjection(gl);

        this.drawObject(this.getObject('cube'), viewProjectionMatrix);
    }

    setupViewProjection(gl: WebGL2RenderingContext): Mat4 {
        // Field of view of 60 degrees vertically, in radians
        const fov = 60 * Math.PI / 180;
        const canvas = gl.canvas as HTMLCanvasElement;
        const aspect = canvas.clientWidth / canvas.clientHeight;

        // Matrices for the world view
        const projectionMatrix = M4.perspective(fov, aspect, 1, 200);

        const cameraPosition: Vec3 = V3.create(0, 0, 10);
        const target: Vec3 = V3.create(0, 0, 0);
        const up: Vec3 = V3.create(0, 1, 0);

        const cameraMatrix = M4.lookAt(cameraPosition, target, up);
        const viewMatrix = M4.inverse(cameraMatrix);
        const viewProjectionMatrix = M4.multiply(projectionMatrix, viewMatrix);

        return viewProjectionMatrix;
    }

    // Setup UI controls to transform the object
    setupUI() {
        const model = this.getObject('cube');

        const gui = new GUI();

        // Create the UI elements for each value
        const traFolder = gui.addFolder('Translation:')
        traFolder.add( model.transforms.t, 'x', -5, 5)
        traFolder.add( model.transforms.t, 'y', -5, 5)
        traFolder.add( model.transforms.t, 'z', -5, 5)

        const rotFolder = gui.addFolder('Rotation:')
        rotFolder.add( model.transforms.rd, 'x', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                model.transforms.rr.x = value * Math.PI / 180.0;
            });
        rotFolder.add( model.transforms.rd, 'y', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                model.transforms.rr.y = value * Math.PI / 180.0;
            });
        rotFolder.add( model.transforms.rd, 'z', -360, 360)
            .decimals(2)
            .onChange( (value: number) => {
                model.transforms.rr.z = value * Math.PI / 180.0;
            });

        const scaFolder = gui.addFolder('Scale:')
        scaFolder.add( model.transforms, 's_all', -5, 5)
            .onChange( (value: number) => {
                model.transforms.s.x = value;
                model.transforms.s.y = value;
                model.transforms.s.z = value;
            })
        scaFolder.add( model.transforms.s, 'x', -5, 5)
            .listen()
        scaFolder.add( model.transforms.s, 'y', -5, 5)
            .listen()
        scaFolder.add( model.transforms.s, 'z', -5, 5)
            .listen()
    }
}

/*
 * Main function to initialize the WebGL context, create the scene, and set up the UI.
 */
function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new CubeOneScene(gl);
    scene.setupUI();
    scene.draw();
}

main()
