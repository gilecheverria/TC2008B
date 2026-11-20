/*
 * Activity: Implementing the Phong lighting model.
 *
 * SCAFFOLDING -- the scene, cube, camera, light and GUI are already done.
 * Your work is in this file and in the GLSL files (see README.md for the
 * parts and hints):
 *      - vs_phong_activity.glsl
 *      - fs_phong_activity.glsl
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, type Mat4, type Vec3 } from '../../libs/3d-lib';
import { Scene } from '../../libs/scene.js';
import { randomColor } from '../../libs/color.ts';
import { Object3D } from '../../libs/object3d.ts';
import { Camera3D } from '../../libs/camera3d.ts';
import { Light3D } from '../../libs/light3d.ts';
import { cubeFaceColors } from '../../libs/shapes.ts';

// Define the shader code, using GLSL 3.00 -- THIS is where you work
import vsGLSL from './vs_phong_activity.glsl?raw';
import fsGLSL from './fs_phong_activity.glsl?raw';

class PhongActivityScene extends Scene {

    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 10,
            y: 10,
            z: 10,
        },
        repeat: {
            rows: 1,
            cols: 1,
        }
    };

    // Duration of the animation in milliseconds
    duration: number = 1000;
    camera: Camera3D;
    lights: Light3D[] = [];
    object: Object3D;

    // Baseline colors of the light, so the GUI intensity slider can
    // scale them without losing the original hue/saturation.
    private lightBase = {
        ambient:  [1, 1, 1, 1],
        diffuse:  [1, 1, 1, 1],
        specular: [1, 1, 1, 1],
    };

    // Multiplier applied to the three light colors by the GUI slider.
    lightIntensity = 1.0;

    /**
     * Rescale the three light colors from the baseline colors using
     * the current lightIntensity. Colors are vec4 arrays.
     */
    private applyLightIntensity(): void {
        const i = this.lightIntensity;
        (['ambient', 'diffuse', 'specular'] as const).forEach((term) => {
            const base = this.lightBase[term];
            this.lights[0][term] = [base[0] * i, base[1] * i, base[2] * i, 1.0];
        });
    }

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);

        // Configure the camera for this scene
        this.camera = new Camera3D(
            0,              // ID
            10,             // Distance to target (cube is at the origin)
            0,              // Azimut
            0,              // Elevation
            [0, 0, 0],      // Position (ignored: position comes from the spherical params)
            [0, 0, 0]);     // Target
        // Make the camera respond to keyboard events
        this.camera.setupControls();

        this.lights.push(new Light3D(
            0,                      // ID
            [3, 3, 5],              // Position
            [0.3, 0.3, 0.3, 1.0],   // Ambient
            [1.0, 1.0, 1.0, 1.0],   // Diffuse
            [1.0, 1.0, 1.0, 1.0],   // Specular
        ));

        // Create the cube object for this scene
        this.object = this.addObject('cube', cubeFaceColors(3), randomColor());
    }

    drawObject(object: Object3D, viewProjectionMatrix: Mat4): void {
        const { gl, programInfo } = this;

        // Prepare the vectors for translation and scale
        let v3_tra: Vec3 = object.posArray;
        let v3_sca: Vec3 = object.scaArray;

        // Create the individual transform matrices
        const scaMat: Mat4 = M4.scale(v3_sca);
        const rotXMat: Mat4 = M4.rotationX(object.transforms.rr.x);
        const rotYMat: Mat4 = M4.rotationY(object.transforms.rr.y);
        const rotZMat: Mat4 = M4.rotationZ(object.transforms.rr.z);
        const traMat: Mat4 = M4.translation(v3_tra);

        // Create the composite matrix with all transformations
        let transforms: Mat4 = M4.identity();
        transforms = M4.multiply(scaMat, transforms);
        transforms = M4.multiply(rotXMat, transforms);
        transforms = M4.multiply(rotYMat, transforms);
        transforms = M4.multiply(rotZMat, transforms);
        transforms = M4.multiply(traMat, transforms);

        // Apply the projection to the final matrix for the
        // World-View-Projection
        const wvpMat: Mat4 = M4.multiply(viewProjectionMatrix, transforms);

        // The matrix to be used for normal transformations
        const normalMat = M4.transpose(M4.inverse(transforms));

        // Send the model uniforms to the shader so that the
        // rotation/scale/translation computed above actually take effect.
        const uniforms: { [key: string]: unknown } = {
            u_world: transforms,
            u_worldInverseTransform: normalMat,
            u_worldViewProjection: wvpMat,
            u_ambientColor: object.color,
            u_diffuseColor: object.color,
            u_specularColor: object.color,
            u_shininess: object.shininess,
        };
        twgl.setUniforms(programInfo, uniforms);

        gl.bindVertexArray(object.vao);
        twgl.drawBufferInfo(gl, object.bufferInfo);
    }

    // Function to do the actual display of the scene
    render(deltaTime: number): void {
        const { gl, programInfo } = this;

        // Clear the canvas with a carbon-gray background so that the
        // (still black) placeholder cube is visible before any work is done
        gl.clearColor(0.16, 0.16, 0.16, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell webgl to cull faces
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(programInfo.program);

        // TODO: UNIFORMS (scene) -- send to the shader the data that
        // describes the scene and is shared by every object: the light
        // (position and the three colors) and the view position
        // (this.camera). All of it lives in this.lights[0] and
        // this.camera (see Light3D and Camera3D in ../../libs).
        //
        // twgl.setUniforms(programInfo, { /* ... */ });

        // Check for camera keys and update the camera position
        this.camera.checkKeys();
        const viewProjectionMatrix = this.camera.setupViewProjection(gl);

        const cube = this.getObject('cube');
        this.renderMultipleCubes(viewProjectionMatrix, cube, deltaTime);
    }

    renderMultipleCubes(
        viewProjectionMatrix: Mat4,
        object: Object3D,
        deltaTime: number
    ): void {
        // Draw the object multiple times
        const distance = 3;

        // Calculate the fraction of the duration that has passed
        const fract = deltaTime / this.duration;

        // Rotate the base object according to the settings
        object.transforms.rd.x = (object.transforms.rd.x + this.settings.rotationSpeed.x * fract) % 360;
        object.transforms.rd.y = (object.transforms.rd.y + this.settings.rotationSpeed.y * fract) % 360;
        object.transforms.rd.z = (object.transforms.rd.z + this.settings.rotationSpeed.z * fract) % 360;
        object.transforms.rr.x = object.transforms.rd.x * Math.PI / 180;
        object.transforms.rr.y = object.transforms.rd.y * Math.PI / 180;
        object.transforms.rr.z = object.transforms.rd.z * Math.PI / 180;

        this.drawObject(object, viewProjectionMatrix);
    }

    // Setup UI controls to inspect the lighting
    setupUI() {
        const gui = new GUI();
        const model = this.getObject('cube');

        const animFolder = gui.addFolder('Animation:')
        animFolder.add( this.settings.rotationSpeed, 'x', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'y', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'z', 0, 360).decimals(2)

        const modelFolder = gui.addFolder('Model material')
        modelFolder.addColor( this.object, 'color')
        modelFolder.add( this.object, 'shininess', 1, 200, 1).name('Shininess')

        // Settings for the light
        const lightFolder = gui.addFolder('Light:')
        lightFolder.add( this.lights[0].position, 'x', -20, 20)
            .name('Position X').decimals(2)
        lightFolder.add( this.lights[0].position, 'y', -20, 20)
            .name('Position Y').decimals(2)
        lightFolder.add( this.lights[0].position, 'z', -20, 20)
            .name('Position Z').decimals(2)

        // Capture the initial light colors as the baseline for the
        // intensity scaling (see applyLightIntensity)
        this.lightBase.ambient  = [ ...this.lights[0].ambient ];
        this.lightBase.diffuse  = [ ...this.lights[0].diffuse ];
        this.lightBase.specular = [ ...this.lights[0].specular ];

        lightFolder.addColor(this.lights[0], 'ambient')
            .onChange(() => {
                this.lightBase.ambient = [ ...this.lights[0].ambient ];
                this.applyLightIntensity();
            })
        lightFolder.addColor(this.lights[0], 'diffuse')
            .onChange(() => {
                this.lightBase.diffuse = [ ...this.lights[0].diffuse ];
                this.applyLightIntensity();
            })
        lightFolder.addColor(this.lights[0], 'specular')
            .onChange(() => {
                this.lightBase.specular = [ ...this.lights[0].specular ];
                this.applyLightIntensity();
            })

        lightFolder.add( this, 'lightIntensity', 0, 2, 0.05 )
            .name('Intensity')
            .onChange( () => this.applyLightIntensity() )

        animFolder.close();
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

    const scene = new PhongActivityScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
