// A01786776 Yael Uriel Ordaz García
'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { diamond, smiley } from '../libs/shapes.js';
import { V2, M3, type Vec2, type Mat3 } from '../libs/2d-lib.js';
import { Scene } from '../libs/scene.js';
import { type Color } from '../libs/color.js';

// Import the shaders from external files
import vsGLSL from './vs_matrices_vcolor.glsl?raw';
import fsGLSL from './fs_vertex_color.glsl?raw';

// Available transformation orders
const transformOrders = [
    'scale -> rotation -> translation',
    'scale -> translation -> rotation',
    'translation -> scale -> rotation',
    'rotation -> translation -> scale',
    'rotation -> scale -> translation'
];

// Subclass of Scene with the particular objects and settings
class RotationScene extends Scene {

    // Variable for the scene settings
    settings = {
        transformOrder: 'scale -> rotation -> translation'
    };

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vsGLSL, fsGLSL);

        // Create the objects for this scene
        const model = this.addObject('model', smiley(150),
            [Math.random(), Math.random(), Math.random(), 1]);

        model.transforms.t.x = gl.canvas.width / 2;
        model.transforms.t.y = gl.canvas.height / 2;

        // Create the pivot object
        const pivot = this.addObject('pivot', diamond(30),
            [0.6, 0.6, 0.6, 1]);

        pivot.transforms.t.x = gl.canvas.width / 2;
        pivot.transforms.t.y = gl.canvas.height / 2;
    }

    // Method to draw the scene
    protected render(): void {
        const { gl, programInfo } = this;

        const model = this.getObject('model');
        const pivot = this.getObject('pivot');

        // Vectors for translation and scale
        const v2_trans: Vec2 = V2.create(
            model.transforms.t.x,
            model.transforms.t.y
        );

        const v2_scale: Vec2 = V2.create(
            model.transforms.s.x,
            model.transforms.s.y
        );

        // Vector to translate the pivot to the origin
        const v2_pivot_to_origin: Vec2 = V2.create(
            -pivot.transforms.t.x,
            -pivot.transforms.t.y
        );

        // Vector to translate the origin back to the pivot
        const v2_origin_to_pivot: Vec2 = V2.create(
            pivot.transforms.t.x,
            pivot.transforms.t.y
        );

        // Transformation matrices for the model
        const translateMatrixModel: Mat3 =
            M3.translation(v2_trans);

        const rotateMatrixModel: Mat3 =
            M3.rotation(model.transforms.rr.z);

        const scaleMatrixModel: Mat3 =
            M3.scale(v2_scale);

        // Matrices to perform rotation around the pivot
        const translatePivotToOrigin: Mat3 =
            M3.translation(v2_pivot_to_origin);

        const translateOriginToPivot: Mat3 =
            M3.translation(v2_origin_to_pivot);

        // Composite rotation matrix around the pivot
        let rotationAroundPivot: Mat3 = M3.identity();

        rotationAroundPivot = M3.multiply(
            translatePivotToOrigin,
            rotationAroundPivot
        );

        rotationAroundPivot = M3.multiply(
            rotateMatrixModel,
            rotationAroundPivot
        );

        rotationAroundPivot = M3.multiply(
            translateOriginToPivot,
            rotationAroundPivot
        );

        // Store the transformation matrices
        const transformations: Record<string, Mat3> = {
            'scale': scaleMatrixModel,
            'rotation': rotationAroundPivot,
            'translation': translateMatrixModel
        };

        // Create the composite transformation matrix
        let modelTransforms: Mat3 = M3.identity();

        // Apply transformations in the selected order
        const selectedOrder = this.settings.transformOrder.split(' -> ');

        for (const transform of selectedOrder) {
            modelTransforms = M3.multiply(
                transformations[transform],
                modelTransforms
            );
        }

        // Draw the model
        gl.useProgram(programInfo.program);

        let uniforms = {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_transforms: modelTransforms,
            u_color: model.color,
        };
        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(model.vao);
        twgl.drawBufferInfo(gl, model.bufferInfo);

        // Transformation matrix for the pivot
        const translateMatrixPivot: Mat3 =
            M3.translation(v2_origin_to_pivot);

        // Composite transformation matrix for the pivot
        let pivotTransforms: Mat3 = M3.identity();

        pivotTransforms = M3.multiply(
            translateMatrixPivot,
            pivotTransforms
        );

        // Draw the pivot
        uniforms = {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_transforms: pivotTransforms,
            u_color: pivot.color,
        };
        twgl.setUniforms(programInfo, uniforms);
        gl.bindVertexArray(pivot.vao);
        twgl.drawBufferInfo(gl, pivot.bufferInfo);
    }

    // Setup UI controls
    setupUI(): void {
        const { gl } = this;
        const model = this.getObject('model');
        const pivot = this.getObject('pivot');

        const gui = new GUI();

        // Model controls
        const modelFolder = gui.addFolder('Model');

        // Translation controls
        const traFolder = modelFolder.addFolder('Translation');
        traFolder.add(model.transforms.t, 'x', 0, gl.canvas.width)
            .onChange((value: number) => {
                model.transforms.t.x = value;
            });
        traFolder.add(model.transforms.t, 'y', 0, gl.canvas.height)
            .onChange((value: number) => {
                model.transforms.t.y = value;
            });

        // Rotation controls
        const rotFolder = modelFolder.addFolder('Rotation');
        rotFolder.add(model.transforms.rr, 'z', 0, Math.PI * 2)
            .onChange((value: number) => {
                model.transforms.rr.z = value;
            });

        // Scale controls
        const scaFolder = modelFolder.addFolder('Scale');
        scaFolder.add(model.transforms.s, 'x', -5, 5)
            .onChange((value: number) => {
                model.transforms.s.x = value;
            });
        scaFolder.add(model.transforms.s, 'y', -5, 5)
            .onChange((value: number) => {
                model.transforms.s.y = value;
            });

        // Color controls
        const colorFolder = modelFolder.addFolder('Color');
        colorFolder.addColor(model, 'color')
            .onChange((value: Color) => {
                model.color = value;
            });

        // Transformation order selector
        const orderFolder = modelFolder.addFolder('Transformation Order');

        orderFolder.add(
            this.settings,
            'transformOrder',
            transformOrders
        ).name('Order');

        // Pivot controls
        const pivotFolder = gui.addFolder('Pivot');
        const pivotTraFolder = pivotFolder.addFolder('Translation');
        pivotTraFolder.add(pivot.transforms.t, 'x', 0, gl.canvas.width)
            .onChange((value: number) => {
                pivot.transforms.t.x = value;
            });
        pivotTraFolder.add(pivot.transforms.t, 'y', 0, gl.canvas.height)
            .onChange((value: number) => {
                pivot.transforms.t.y = value;
            });
    }
}

// Main function to initialize WebGL and the scene
function main(): void {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error('No canvas element found in the document');
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 is not supported by this browser');
    }

    const scene = new RotationScene(gl);
    scene.setupUI();
    scene.draw(0);
}

main();
