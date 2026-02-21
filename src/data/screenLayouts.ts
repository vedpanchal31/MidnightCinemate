export type ScreenType = "2D" | "3D" | "IMAX" | "4DX";

export type ScreenSeatLayout = {
  rows: string[];
  blockSizes: number[];
  vipRows: number;
  premiumRows: number;
};

const DEFAULT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const SCREEN_SEAT_LAYOUTS: Record<ScreenType, ScreenSeatLayout> = {
  "2D": {
    rows: DEFAULT_ROWS,
    blockSizes: [4, 4, 4],
    vipRows: 2,
    premiumRows: 3,
  },
  "3D": {
    rows: DEFAULT_ROWS,
    blockSizes: [4, 3, 4],
    vipRows: 2,
    premiumRows: 3,
  },
  IMAX: {
    rows: DEFAULT_ROWS,
    blockSizes: [5, 4, 5],
    vipRows: 2,
    premiumRows: 3,
  },
  "4DX": {
    rows: DEFAULT_ROWS,
    blockSizes: [4, 3, 3],
    vipRows: 2,
    premiumRows: 3,
  },
};

export const getScreenSeatLayout = (
  screenType?: string | null,
): ScreenSeatLayout => {
  if (!screenType) return SCREEN_SEAT_LAYOUTS["2D"];
  return (
    SCREEN_SEAT_LAYOUTS[screenType as ScreenType] ?? SCREEN_SEAT_LAYOUTS["2D"]
  );
};

export const getScreenTypeCapacity = (screenType?: string | null): number => {
  const layout = getScreenSeatLayout(screenType);
  const seatsPerRow = layout.blockSizes.reduce((sum, size) => sum + size, 0);
  return layout.rows.length * seatsPerRow;
};
