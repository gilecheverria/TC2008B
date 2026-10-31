/*
 * Drawing multiple objects in the same scene, with different colors.
 * Drawing the position of the light source as well, using a different shader.
 * The objects also have textures
 *
 * Gilberto Echeverria
 * 2026-08-28
 */


'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4, V3, type Mat4, type Vec3 } from '../libs/3d-lib';
import { Scene } from '../libs/scene_multi_shader.js';
import { type Color, randomColor } from '../libs/color.ts';
import { Object3DProgram } from '../libs/object3d_multi_shader.ts';
import { Camera3D } from '../libs/camera3d.ts';
import { Light3D } from '../libs/light3d.ts';
import { ObjLoader, type ObjArrays } from '../libs/obj_loader.js';

// Define the shader code, using GLSL 3.00
import vsPhongGLSL from '../assets/shaders/vs_multi_lights_attenuation.glsl?raw';
import fsPhongGLSL from '../assets/shaders/fs_multi_lights_attenuation.glsl?raw';
import vsFlatGLSL from '../assets/shaders/vs_flat.glsl?raw';
import fsFlatGLSL from '../assets/shaders/fs_flat.glsl?raw';


// Read the whole input file as a string
// https://vitejs.dev/guide/assets.html#importing-asset-as-string
import teddyString from './../assets/models/teddy_normals_uv.obj?raw';
import triceString from './../assets/models/triceratops_normals_uv.obj?raw';
import teapotString from './../assets/models/utah_teapot_uv.obj?raw';
import horseString from './../assets/models/horse_normals_uv.obj?raw';
import sphereFlatString from '../assets/models/sphere_flat.obj?raw';

class LitObjectsScene extends Scene {

    // Variable for the scene settings
    settings = {
        // Speed in degrees
        rotationSpeed: {
            x: 40,
            y: 40,
            z: 40,
        },
        ambientColor: [0.3, 0.3, 0.3, 1.0],
        lightColor1: [1.0, 1.0, 0.0, 1.0],
        lightColor2: [0.0, 1.0, 1.0, 1.0],
        lightColor3: [1.0, 0.0, 1.0, 1.0],

        // Attenuation values
        constant: 1.0,
        linear: 0.03,
        quadratic: 0.003,
    };

    // Dictionary for the OBJ files to be loaded
    objStrings = {
        'teddy': teddyString,
        'triceratops': triceString,
        'teapot': teapotString,
        'horse': horseString,
    };

    lightInfo = {
        'light1': {
            id: 1,
            position: [3, 3, 5],
            color: this.settings.lightColor1,
        },
        'light2': {
            id: 2,
            position: [-3, -3, 3],
            color: this.settings.lightColor2,
        },
        'light3': {
            id: 3,
            position: [3, -3, -3],
            color: this.settings.lightColor3,
        },
    }

    // Duration of the animation in milliseconds
    duration: number = 1000;
    camera: Camera3D;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            phong: {vs: vsPhongGLSL, fs: fsPhongGLSL},
            flat: {vs: vsFlatGLSL, fs: fsFlatGLSL},
        });

        // Configure the camera for this scene
        this.camera = new Camera3D(
            0,              // ID
            20,             // Distance to target
            0,              // Azimut
            0,              // Elevation
            [0, 0, 10],
            [0, 0, 0]);
        // Make the camera respond to keyboard events
        this.camera.setupControls();

        // Create the objects to display in the scene
        for (const [name, objString] of Object.entries(this.objStrings)) {
            const loader = new ObjLoader();
            const objArrays: ObjArrays = loader.loadObj(objString);
            const object = this.addObject(name, 'phong', objArrays, randomColor());

            // Get a texture ready to be drawn on the objects
            try {
                object.texture = twgl.createTexture(gl, {
                    min: gl.NEAREST,
                    mag: gl.NEAREST,
                    // Invert the Y axis of the texture
                    flipY: true,
                    src: './../assets/textures/f-texture.png'
                });
            } catch (error) {
                console.log(error)
            }
        }

        // Set the position for each of the 4 models to be displayed
        const offset = 4.0;
        this.getObject('teddy').transforms.t = { x: -offset, y: offset, z: 0 };
        this.getObject('triceratops').transforms.t = { x: offset, y: offset, z: 0 };
        this.getObject('teapot').transforms.t = { x: -offset, y: -offset, z: 0 };
        this.getObject('horse').transforms.t = { x: offset, y: -offset, z: 0 };

        // Use the sphere object to represent the lights
        const loader = new ObjLoader();
        const objArrays: ObjArrays = loader.loadObj(sphereFlatString);

        // Create the light elements with an object to visualize them
        for (const [name, info] of Object.entries(this.lightInfo)) {
            const light = new Light3D(
                info.id,
                info.position,
                this.settings.ambientColor,
                info.color,
                info.color,
            );
            this.addLightWithObject(name, 'flat', objArrays, light);
        }
    }

    prepareObject(name: string, object: Object3DProgram, viewProjectionMatrix: Mat4): void {
        // Get the WebGL context and program info

        // Prepare the vector for translation and scale
        const v3_tra: Vec3 = object.posArray;
        const v3_sca: Vec3 = object.scaArray;

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

        let uniforms = {
            u_world: transforms,
            u_worldViewProjection: wvpMat,
            u_worldInverseTransform: normalMat,
            u_ambientColor: object.color,
            u_diffuseColor: object.color,
            u_specularColor: object.color,
            u_shininess: object.shininess,
            u_texture: object.texture
        }

        this.drawObject(name, uniforms);
    }

    prepareLight(object: Object3DProgram, viewProjectionMatrix: Mat4): void {
        const v3_trans: Vec3 = object.posArray;
        const v3_scale: Vec3 = object.scaArray;

        // Matrices for the object world transforms
        const traMat: Mat4 = M4.translation(v3_trans);
        const scaMat: Mat4 = M4.scale(v3_scale);

        let world: Mat4 = M4.identity();
        world = M4.multiply(scaMat, world);
        world = M4.multiply(traMat, world);
        const wvpMat: Mat4 = M4.multiply(viewProjectionMatrix, world);

        let uniforms = {
            u_color: object.color,
            u_transforms: wvpMat,
        }

        this.drawObject('light1', uniforms);
    }

    // Function to do the actual display of the scene
    render(deltaTime: number): void {
        const { gl } = this;

        // Clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell webgl to cull faces
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Create larger arrays with the data for all the lights
        let lightPositions: number[] = [];
        let lightDiffuses: number[] = [];
        let lightSpeculars: number[] = [];
        for (const [_name, light] of this.allLights) {
            lightPositions = lightPositions.concat(...light.posArray);
            lightDiffuses = lightDiffuses.concat(...light.diffuse);
            lightSpeculars = lightSpeculars.concat(...light.specular);
        }

        // Scene uniforms
        const globalUniforms = {
            u_viewWorldPosition: this.camera.posArray,
            u_ambientLight: this.settings.ambientColor,
            // Arrays with the data for all lights
            u_lightWorldPosition: lightPositions,
            u_diffuseLight: lightDiffuses,
            u_specularLight: lightSpeculars,
            // Attenuation values
            u_constant: this.settings.constant,
            u_linear: this.settings.linear,
            u_quadratic: this.settings.quadratic,
        }
    //console.log(globalUniforms);
        // Set the global uniforms for all the programs used
        for (const [_name, program] of this.programs) {
            gl.useProgram(program.program);
            twgl.setUniforms(program, globalUniforms);
        }

        // Check for camera keys and update the camera position
        this.camera.checkKeys();
        const viewProjectionMatrix = this.camera.setupViewProjection(gl);

        this.renderMultipleObjects(viewProjectionMatrix, deltaTime);

        // Draw the lights in the scene
        for (const [name, _light] of this.allLights) {
            this.prepareLight(this.getObject(name), viewProjectionMatrix);
        }
    }

    renderMultipleObjects(
        viewProjectionMatrix: Mat4,
        deltaTime: number
    ): void {
        // Calculate the fraction of the duration that has passed
        const fract = deltaTime / this.duration;

        for (const [name, object] of this.allObjects) {
            // Rotate the base object according to the settings
            object.transforms.rd.x = (object.transforms.rd.x + this.settings.rotationSpeed.x * fract) % 360;
            object.transforms.rd.y = (object.transforms.rd.y + this.settings.rotationSpeed.y * fract) % 360;
            object.transforms.rd.z = (object.transforms.rd.z + this.settings.rotationSpeed.z * fract) % 360;
            object.transforms.rr.x = object.transforms.rd.x * Math.PI / 180;
            object.transforms.rr.y = object.transforms.rd.y * Math.PI / 180;
            object.transforms.rr.z = object.transforms.rd.z * Math.PI / 180;

            this.prepareObject(name, object, viewProjectionMatrix);
        }
    }

    // Setup UI controls to transform the object
    setupUI() {
        const gui = new GUI();

        /*
        const modelFolder = gui.addFolder('Model material')
        modelFolder.addColor( this.object, 'color')
        modelFolder.add( this.object, 'shininess', 1, 200, 1)
        */

        const animFolder = gui.addFolder('Animation:')
        animFolder.add( this.settings.rotationSpeed, 'x', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'y', 0, 360).decimals(2)
        animFolder.add( this.settings.rotationSpeed, 'z', 0, 360).decimals(2)

        animFolder.close();

        const sceneFolder = gui.addFolder('Scene:');
        sceneFolder.addColor(this.settings, 'ambientColor')
        sceneFolder.add( this.settings, 'constant', -1, 2).decimals(2);
        sceneFolder.add( this.settings, 'linear', 0, 0.2).decimals(3);
        sceneFolder.add( this.settings, 'quadratic', 0, 0.02).decimals(4);

        // Settings for the lighting
        for (const [name, light] of this.allLights) {
            const lightFolder = sceneFolder.addFolder(`Light ${name}:`)
            lightFolder.add( light.position, 'x', -20, 20)
                .decimals(2)
            lightFolder.add( light.position, 'y', -20, 20)
                .decimals(2)
            lightFolder.add( light.position, 'z', -20, 20)
                .decimals(2)

            //lightFolder.addColor(scene.lights[i], 'ambient')
            lightFolder.addColor(light, 'diffuse')
            //lightFolder.addColor(scene.lights[i], 'specular')
        }

        const objectsFolder = gui.addFolder(`Object colors`);
        // Settings for the animation
        for (const [name, object] of this.allObjects) {
            // Don't control the color of the lights from here
            if (!name.includes("light")) {
                objectsFolder.addColor( object, 'color')
                    .name(`Color object ${name}:`)
            }
        }
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

    const scene = new LitObjectsScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main()
