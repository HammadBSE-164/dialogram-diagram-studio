import type { DiagramNode } from './diagram-data';

export function nodeGeometry(node: DiagramNode) {
  const { x, y } = node.position;
  const actor = node.data.shape === 'actor';
  return { cx: x + 75, cy: y + (actor ? 28 : 30), rx: actor ? 17 : 75, ry: actor ? 28 : node.data.shape === 'usecase' ? 24 : 18 };
}

export function connectionPoint(node: DiagramNode, toward: DiagramNode) {
  const a = nodeGeometry(node), b = nodeGeometry(toward);
  const dx = b.cx - a.cx, dy = b.cy - a.cy;
  if (dx === 0 && dy === 0) return { x: a.cx, y: a.cy };
  const scale = node.data.shape === 'usecase'
    ? 1 / Math.sqrt((dx / a.rx) ** 2 + (dy / a.ry) ** 2)
    : 1 / Math.max(Math.abs(dx) / a.rx, Math.abs(dy) / a.ry);
  return { x: a.cx + dx * scale, y: a.cy + dy * scale };
}