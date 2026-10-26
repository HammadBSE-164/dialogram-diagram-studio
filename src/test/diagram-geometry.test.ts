import { describe, expect, it } from 'vitest';
import { connectionPoint, nodeGeometry } from '@/lib/diagram-geometry';
import type { DiagramNode } from '@/lib/diagram-data';

const node = (shape: DiagramNode['data']['shape'], x: number, y: number): DiagramNode => ({ id: `${shape}-${x}-${y}`, position: { x, y }, data: { label: 'Element', shape } });

describe('Diagram connection boundaries', () => {
  it('connects class boxes at their borders, not at their names', () => {
    const a = node('class', 0, 80), b = node('class', 240, 80);
    expect(connectionPoint(a, b)).toEqual({ x: 150, y: 110 });
    expect(connectionPoint(b, a)).toEqual({ x: 240, y: 110 });
  });
  it('connects diagonal use cases at the ellipse boundary', () => {
    const a = node('usecase', 160, 100), b = node('usecase', 390, 10);
    const p = connectionPoint(a, b), g = nodeGeometry(a);
    expect(((p.x - g.cx) / g.rx) ** 2 + ((p.y - g.cy) / g.ry) ** 2).toBeCloseTo(1);
  });
  it('keeps coincident nodes finite', () => {
    const a = node('class', 0, 0);
    expect(connectionPoint(a, a)).toEqual({ x: 75, y: 30 });
  });
});