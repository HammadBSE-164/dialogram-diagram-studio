import type { DiagramData } from '@/lib/diagram-data';

export function diagramSvg(data: DiagramData) {
  const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] ?? c));
  const xs = data.nodes.map(n => n.position.x), ys = data.nodes.map(n => n.position.y);
  const minX = Math.min(0, ...xs) - 20, minY = (ys.length ? Math.min(...ys) : 0) - 10;
  const width = Math.max(900, ...xs.map(x => x + 180)) - minX, height = Math.max(minY + 70, ...ys.map(y => y + (data.nodes.find(n => n.position.y === y)?.data.shape === 'actor' ? 90 : 65))) - minY;
  const lines = data.edges.map(e => {
    const a = data.nodes.find(n => n.id === e.source), b = data.nodes.find(n => n.id === e.target);
    if (!a || !b) return '';
    return `<line x1="${a.position.x + 75}" y1="${a.position.y + 30}" x2="${b.position.x + 75}" y2="${b.position.y + 30}" stroke="currentColor" opacity=".65" ${e.label ? 'stroke-dasharray="4 4"' : ''}/>`;
  }).join('');
  const shapes = data.nodes.map(n => {
    const { x, y } = n.position;
    const shape = n.data.shape === 'actor' ? `<circle cx="${x + 75}" cy="${y}" r="8"/><path d="M${x + 75} ${y + 8}v32m-17-20h34m-17 20-15 19m15-19 15 19"/>` : n.data.shape === 'usecase' ? `<ellipse cx="${x + 75}" cy="${y + 30}" rx="75" ry="24"/>` : `<rect x="${x}" y="${y + 12}" width="150" height="36" rx="5"/>`;
    return `<g fill="none" stroke="currentColor">${shape}</g><text x="${x + 75}" y="${y + (n.data.shape === 'actor' ? 77 : 34)}" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="12">${escape(n.data.label)}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" role="img">${lines}${shapes}</svg>`;
}
export function DiagramPreview({ data }: { data: DiagramData }) {
  return <div className="diagram-preview w-full text-muted-foreground" dangerouslySetInnerHTML={{ __html: diagramSvg(data) }} />;
}