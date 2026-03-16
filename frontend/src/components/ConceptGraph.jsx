import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

export default function ConceptGraph({ graphData }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData?.nodes?.length) return;

    const PALETTE = ['#7c6bff', '#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb923c'];

    const nodes = new DataSet(
      graphData.nodes.map((n, i) => ({
        id: n.id,
        label: n.label,
        color: {
          background: PALETTE[i % PALETTE.length] + '33',
          border: PALETTE[i % PALETTE.length],
          highlight: { background: PALETTE[i % PALETTE.length] + '55', border: PALETTE[i % PALETTE.length] },
        },
        font: { color: '#f1f5f9', size: 13, face: 'Inter' },
        borderWidth: 2,
        shape: 'dot',
        size: 18,
      }))
    );

    const edges = new DataSet(
      graphData.edges.map((e, i) => ({
        from: e.from,
        to: e.to,
        label: e.label,
        arrows: 'to',
        color: { color: '#475569', highlight: '#7c6bff' },
        font: { color: '#94a3b8', size: 10, face: 'Inter', align: 'middle' },
        smooth: { type: 'curvedCW', roundness: 0.2 },
        width: 1.5,
      }))
    );

    const options = {
      nodes: { borderWidth: 2 },
      edges: { arrows: { to: { enabled: true, scaleFactor: 0.6 } } },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -40, centralGravity: 0.005, springLength: 120 },
        stabilization: { iterations: 150 },
      },
      interaction: { hover: true, tooltipDelay: 200, zoomView: true, dragView: true },
      layout: { randomSeed: 42 },
    };

    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    return () => { if (networkRef.current) networkRef.current.destroy(); };
  }, [graphData]);

  if (!graphData?.nodes?.length) {
    return (
      <div className="graph-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="big-icon">🕸️</div>
          <p>No graph data available.</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="graph-container" id="concept-graph" />;
}
