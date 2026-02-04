'use client';
import { LoadingState } from '@/components/client/LoadingState';
import { useProvGraph } from '@/app/graph/useProvGraph';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Network, Options } from 'react-graph-vis';
import Graph from 'react-graph-vis';

export default function VisNetworkDemoPage() {
    const networkRef = useRef<Network | null>(null);
    const didInitialFitRef = useRef(false);
    const [mounted, setMounted] = useState(false);

    const { graphData, isLoading } = useProvGraph(500);

    useEffect(() => {
        setMounted(true);
    }, []);

    const options: Options = useMemo(() => {
        return {
            layout: { improvedLayout: true },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                stabilization: { enabled: true, iterations: 200, updateInterval: 25 },
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 150,
                    springConstant: 0.04,
                    avoidOverlap: 0.5,
                },
            },
            groups: {
                entity: {
                    shape: 'box',
                    shapeProperties: { borderRadius: 8 },
                    color: { background: '#fef3c7', border: '#6b7280' },
                    font: { face: 'serif', size: 12, bold: { color: '#000000' } },
                },
                activity: {
                    shape: 'box',
                    color: { background: '#e9d5ff', border: '#6b7280' },
                    font: { face: 'serif', size: 16, bold: { color: '#000000' } },
                },
                agent: {
                    shape: 'ellipse',
                    color: { background: '#fed7aa', border: '#6b7280' },
                    font: { face: 'serif', size: 24, bold: { color: '#000000' } },
                },
                literal: {
                    shape: 'box',
                    color: { background: '#f3f4f6', border: '#6b7280' },
                    font: { face: 'serif', size: 12 },
                },
                structural: {
                    color: { color: '#374151' },
                    width: 2,
                    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                    smooth: { enabled: true, type: 'continuous', roundness: 0.3 },
                    font: { face: 'serif', size: 10, align: 'middle' },
                },
                influence: {
                    color: { color: '#ec4899' },
                    width: 2,
                    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                    smooth: { enabled: true, type: 'continuous', roundness: 0.7 },
                    font: { face: 'serif', size: 10, align: 'middle' },
                },
            },
            nodes: { size: 20, scaling: { min: 10, max: 30 }, font: { multi: 'html' } },
            edges: {},
            interaction: { hover: true, multiselect: true, hideEdgesOnDrag: true },
            autoResize: true,
        };
    }, []);

    const getNetwork = (n: Network) => {
        networkRef.current = n;

        if (!didInitialFitRef.current) {
            n.fit({ animation: false });
            didInitialFitRef.current = true;
        }
        setTimeout(() => n.stabilize(), 50);
    };

    if (isLoading) {
        return <LoadingState message='Loading graph data...' />;
    }

    return (
        <div style={{ display: 'flex', gap: 8, height: '85vh' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
                    {mounted && (
                        <Graph key={Math.random()} graph={graphData} options={options} getNetwork={getNetwork} />
                    )}
                </div>
            </div>
        </div>
    );
}
