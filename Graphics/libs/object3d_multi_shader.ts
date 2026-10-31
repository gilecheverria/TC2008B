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

function cloneTransforms(transforms: ObjectTransforms): ObjectTransforms {
    return {
        t: { ...transforms.t },
        rr: { ...transforms.rr },
        rd: { ...transforms.rd },
        s: { ...transforms.s },
        s_all: transforms.s_all,
    };
}

// The GPU-side geometry for a shape: vertex data, buffers, the VAO, and the
// program it was built against. This is expensive to create and never
// changes afterwards, so it is safe - and desirable - to share a single
// GeometryTemplate across many SceneObject instances that look the same but
// are positioned differently (e.g. a forest of identical trees).
export class GeometryTemplate {
    readonly arrays: twgl.Arrays;
    readonly bufferInfo: twgl.BufferInfo;
    readonly vao: WebGLVertexArrayObject;
    readonly programInfo: twgl.ProgramInfo;

    constructor(gl: WebGL2RenderingContext, programInfo: twgl.ProgramInfo, arrays: twgl.Arrays) {
        this.programInfo = programInfo;
        this.arrays = arrays;
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        this.vao = twgl.createVAOFromBufferInfo(gl, programInfo, this.bufferInfo);
    }
}

export class Object3DProgram {
    transforms: ObjectTransforms;
    color: Color;
    shininess: number = 100;
    texture: WebGLTexture | null = null;
    readonly template: GeometryTemplate;
    // Previous position, used to animate using interpolation
    id: string = 'none';
    oldPosArray: V3 = V3.create(0, 0, 0);

    constructor(
        gl: WebGL2RenderingContext,
        programInfo: twgl.ProgramInfo,
        arrays: twgl.Arrays,
        color: Color
    ) {
        this.template = new GeometryTemplate(gl, programInfo, arrays);
        this.transforms = createDefaultTransforms();
        this.color = color;
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

    // Convenience pass-throughs so existing code that reads
    // object.vao / object.bufferInfo / object.programInfo / object.arrays
    // keeps working unchanged - they just forward to the shared template.
    get vao(): WebGLVertexArrayObject {
        return this.template.vao;
    }
    get bufferInfo(): twgl.BufferInfo {
        return this.template.bufferInfo;
    }
    get programInfo(): twgl.ProgramInfo {
        return this.template.programInfo;
    }
    get arrays(): twgl.Arrays {
        return this.template.arrays;
    }

    // Creates an independent copy of this object: same geometry template
    // (shared by reference, no GPU cost), but its own deep-copied
    // `transforms` so moving one instance never affects the other, and its
    // own `color` (defaults to a copy of this instance's color, or pass a
    // new one to give the duplicate a different look).
    clone(color: Color = [...this.color] as Color): Object3DProgram {
        const copy = Object.create(Object3DProgram.prototype) as Object3DProgram;
        (copy as { template: GeometryTemplate }).template = this.template;
        copy.color = color;
        copy.transforms = cloneTransforms(this.transforms);
        return copy;
    }
}
