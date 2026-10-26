import { useCallback, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, addEdge, useNodesState, useEdgesState, type Connection, type NodeProps } from '@xyflow/react';
import { Plus, Trash2, Save, Undo2, Redo2, Download, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useProject } from '@/components/ProjectContext';
import { diagramSvg } from '@/components/DiagramPreview';
import type { DiagramKind, DiagramNode, DiagramData } from '@/lib/diagram-data';

function UmlNode({ data, selected }: NodeProps<DiagramNode>) {
  return <div className={`uml-node uml-${data.shape} ${selected ? 'uml-selected' : ''}`}>
    <Handle type="target" position={Position.Left} />
    {data.shape === 'actor' && <UserRound className="mx-auto mb-1 h-9 w-9" />}
    <span>{data.label}</span>
    <Handle type="source" position={Position.Right} />
  </div>;
}
const nodeTypes = { uml: UmlNode };
export function downloadDiagram(data: DiagramData) {
  const theme = getComputedStyle(document.documentElement);
  const svg = diagramSvg(data).replace('<svg ', `<svg style="--card:${theme.getPropertyValue('--card').trim()};color:${theme.getPropertyValue('--muted-foreground').trim()}" `);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = document.createElement('a'); a.href = url; a.download = 'dialogram-diagram.svg'; a.click(); URL.revokeObjectURL(url);
}

export function DiagramEditor({ kind, onClose }: { kind: DiagramKind; onClose: () => void }) {
  const { diagrams, saveDiagram } = useProject();
  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>(structuredClone(diagrams[kind].nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(structuredClone(diagrams[kind].edges));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<DiagramData[]>([]);
  const [future, setFuture] = useState<DiagramData[]>([]);
  const selected = nodes.find(n => n.id === selectedId);
  const checkpoint = useCallback(() => { setPast(p => [...p, structuredClone({ nodes, edges })]); setFuture([]); }, [nodes, edges]);
  const connect = (connection: Connection) => { checkpoint(); setEdges(e => addEdge(connection, e)); };
  const addNode = (shape: DiagramNode['data']['shape']) => {
    checkpoint(); const id = crypto.randomUUID();
    setNodes(n => [...n, { id, type: 'uml', position: { x: 150 + (n.length % 4) * 170, y: 300 }, data: { label: shape === 'actor' ? 'New actor' : shape === 'class' ? 'New class' : 'New use case', shape } }]); setSelectedId(id);
  };
  const remove = () => {
    checkpoint(); const ids = new Set(nodes.filter(n => n.selected || n.id === selectedId).map(n => n.id));
    setNodes(n => n.filter(item => !ids.has(item.id))); setEdges(e => e.filter(item => !item.selected && !ids.has(item.source) && !ids.has(item.target))); setSelectedId(null);
  };
  const undo = () => {
    const previous = past.at(-1); if (!previous) return;
    setFuture(f => [...f, structuredClone({ nodes, edges })]); setPast(p => p.slice(0, -1)); setNodes(previous.nodes); setEdges(previous.edges);
  };
  const redo = () => {
    const next = future.at(-1); if (!next) return;
    setPast(p => [...p, structuredClone({ nodes, edges })]); setFuture(f => f.slice(0, -1)); setNodes(next.nodes); setEdges(next.edges);
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="diagram-editor max-w-[1100px] w-[calc(100%-32px)] gap-0 overflow-hidden p-0">
      <header className="border-b border-border px-5 py-4 pr-12">
        <DialogTitle className="font-serif text-xl">Edit {kind === 'usecase' ? 'use case' : 'class'} diagram</DialogTitle>
        <DialogDescription className="mt-1">Campus Food Delivery — Interview 2</DialogDescription>
      </header>
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
        {kind === 'usecase' && <Button variant="outline" size="sm" onClick={() => addNode('actor')}><Plus />Actor</Button>}
        <Button variant="outline" size="sm" onClick={() => addNode(kind)}><Plus />{kind === 'class' ? 'Class' : 'Use case'}</Button>
        <Button title="Undo" aria-label="Undo" variant="ghost" size="icon" disabled={!past.length} onClick={undo}><Undo2 /></Button>
        <Button title="Redo" aria-label="Redo" variant="ghost" size="icon" disabled={!future.length} onClick={redo}><Redo2 /></Button>
        <Button title="Delete selected" aria-label="Delete selected" variant="ghost" size="icon" onClick={remove}><Trash2 /></Button>
        <Button title="Download SVG" aria-label="Download SVG" variant="ghost" size="icon" onClick={() => downloadDiagram({ nodes, edges })}><Download /></Button>
        <Button className="ml-auto" size="sm" onClick={() => { saveDiagram(kind, { nodes, edges }); onClose(); }}><Save />Save changes</Button>
      </div>
      <div className="editor-body flex h-[min(65vh,560px)] min-h-[300px]">
        <div className="min-w-0 flex-1">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} onNodeClick={(_, n) => setSelectedId(n.id)} onPaneClick={() => setSelectedId(null)} onNodeDragStart={checkpoint} onBeforeDelete={async () => { checkpoint(); return true; }} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.2} maxZoom={2} defaultEdgeOptions={{ type: 'straight' }}>
            <Background gap={22} /><Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="w-52 shrink-0 border-l border-border bg-sidebar p-4">
          <h3 className="mb-4 text-xs font-medium text-muted-foreground">PROPERTIES</h3>
          {selected ? <label className="block text-sm">Name<input aria-label="Element name" className="mt-2 w-full rounded border border-input bg-background p-2 text-sm" value={selected.data.label} onFocus={checkpoint} onChange={e => setNodes(n => n.map(item => item.id === selected.id ? { ...item, data: { ...item.data, label: e.target.value } } : item))} /></label> : <p className="text-sm text-muted-foreground">No element selected</p>}
          <p className="mt-6 font-mono text-xs text-muted-foreground">{nodes.length} elements · {edges.length} connections</p>
        </aside>
      </div>
    </DialogContent>
  </Dialog>;
}