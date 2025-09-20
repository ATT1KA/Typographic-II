export const GRID_SIZE = 48;
export const GRID_OFFSET = GRID_SIZE / 2; // align to dot centers if pattern is half-offset

export const roundToGrid = (value: number, unit: number = GRID_SIZE) => Math.round(value / unit) * unit;

export const roundToGridOffset = (
	value: number,
	unit: number = GRID_SIZE,
	offset: number = GRID_OFFSET
) => Math.round((value - offset) / unit) * unit + offset;