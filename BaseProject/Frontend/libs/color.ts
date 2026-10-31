/*
 * Types and functions to represent colors.
 *
 * Gilberto Echeverria
 * 2026-07-27
 */

export type Color = [number, number, number, number];

export function randomColor(): Color {
    return [ Math.random(), Math.random(), Math.random(), 1 ];
}
