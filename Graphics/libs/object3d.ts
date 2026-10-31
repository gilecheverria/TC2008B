/*
 * Classes to describe an object in a WebGL scene.
 * Following a structure proposed by Claude.
 *
 * Gilberto Echeverría
 * 2026-07-15
 */

'use strict';

import * as twgl from 'twgl-base.js';
import { V3 } from '../libs/3d-lib.js';
import { type Color } from '../libs/color.js';
import { ObjectTransforms } from '../libs/vecXYZ.js';

export function createDefaultTransforms(): ObjectTransforms {
    return {
        t: { x: 0, y: 0, z: 0 },
        rr: { x: 0, y: 0, z: 0 },
        rd: { x: 0, y: 0, z: 0 },
        s: { x: 1.0, y: 1.0, z: 1.0 },
        s_all: 1.0,
    };
}

export class Object3D {
    transforms: ObjectTransforms = createDefaultTransforms();
    color: Color;
    shininess: number = 100;
    texture: WebGLTexture | null = null;
    readonly arrays: twgl.Arrays;
    readonly bufferInfo: twgl.BufferInfo;
    readonly vao: WebGLVertexArrayObject;
    readonly programInfo: twgl.ProgramInfo;

    constructor(
        gl: WebGL2RenderingContext,
        programInfo: twgl.ProgramInfo,
        arrays: twgl.Arrays,
        color: Color
    ) {
        this.programInfo = programInfo;
        this.arrays = arrays;
        this.color = color;
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        this.vao = twgl.createVAOFromBufferInfo(gl, programInfo, this.bufferInfo);
    }

    // Return the position as an array
    get posArray() {
        return V3.create(this.transforms.t.x, this.transforms.t.y, this.transforms.t.z);
    }

    // Return the scale as an array
    get scaArray() {
        return V3.create(this.transforms.s.x, this.transforms.s.y, this.transforms.s.z);
    }

    setPosition(x: number, y: number, z: number): void {
        this.transforms.t.x = x;
        this.transforms.t.y = y;
        this.transforms.t.z = z;
    }
}
