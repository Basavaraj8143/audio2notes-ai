import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

export default function ConceptGraph({ graphData }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    const { nodes, edges } = graphData;

    // Create DataSets for vis-network
    const visNodes = new DataSet(nodes.map(n => ({
        id: n.id,
        label: n.label,
        color: {
            background: '#3b82f6',
            border: '#2563eb',
            highlight: { background: '#60a5fa', border: '#3b82f6' }
        },
        font: { color: '#ffffff', face: 'Inter, system-ui, sans-serif' },
        shape: 'box',
        margin: 10,
        borderRadius: 8
    })));

    const visEdges = new DataSet(edges.map((e, index) => ({
        id: index,
        from: e.from,
        to: e.to,
        label: e.label,
        arrows: 'to',
        color: { color: '#94a3b8', highlight: '#3b82f6' },
        font: { align: 'top', size: 10, color: '#64748b' }
    })));

    const data = { nodes: visNodes, edges: visEdges };

    const options = {
      physics: {
        enabled: true,
        stabilization: { iterations: 150 },
        forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 100,
            springConstant: 0.08
        },
        solver: 'forceAtlas2Based'
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true
      },
      layout: {
        randomSeed: 2
      }
    };

    networkRef.current = new Network(containerRef.current, data, options);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '500px', 
        width: '100%', 
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }} 
    />
  );
}
