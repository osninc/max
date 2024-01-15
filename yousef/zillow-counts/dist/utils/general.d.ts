import { IMapBounds } from './types';
export declare const createCoordinateGrid: (mapBounds: IMapBounds, gridSize?: number) => {
    east: number;
    west: number;
    north: number;
    south: number;
}[];
