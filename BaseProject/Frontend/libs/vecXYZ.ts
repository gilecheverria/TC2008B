/*
 * General interface for a type of data to store a coordinate in 3D as an object.
 *
 * Gilberto Echeverria
 * 2026-08-24
 */

export interface VecXYZ {
    x: number;
    y: number;
    z: number;
}

export interface ObjectTransforms {
    t: VecXYZ;
    rr: VecXYZ;
    rd: VecXYZ;
    s: VecXYZ;
    s_all: number;
}
