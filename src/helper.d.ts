import type { Vertex, SignMap } from "./types";

export const alpha: string;
export const vertexEvents: string[];

export function avg(xs: number[]): number;
export function range(n: number): number[];
export function random(n: number): number;
export function neighborhood(vertex: Vertex): Vertex[];
export function vertexEquals(v1: Vertex, v2: Vertex): boolean;
export function lineEquals(line1: [Vertex, Vertex], line2: [Vertex, Vertex]): boolean;
export function signEquals(...xs: number[]): boolean;
export function getHoshis(width: number, height: number): Vertex[];
export function readjustShifts(shiftMap: number[][], vertex?: Vertex | null): number[][];
export function diffSignMap(before: SignMap, after: SignMap): Vertex[];
