'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Graph from 'react-graph-vis';
import type { Network, Node, Edge, Options } from 'react-graph-vis';
import { createDummyProvData } from './graphGenerator';
import { Loader } from 'lucide-react';
import { X } from 'lucide-react';

export default function VisNetworkDemoPage() {
    const defaultAgents = 2;
    const defaultActivitiesPerAgent = 4;
    const defaultGeneratedPerActivity = 1;
    const defaultUsedPerActivity = 3;
    const defaultSpacingX = 150;

    const initialParams = useMemo(
        () => ({
            agents: defaultAgents,
            activitiesPerAgent: defaultActivitiesPerAgent,
            generatedPerActivity: defaultGeneratedPerActivity,
            usedPerActivity: defaultUsedPerActivity,
            spacingX: defaultSpacingX,
        }),
        [],
    );

    const initialGraph = useMemo(() => createDummyProvData(initialParams), [initialParams]);

    const networkRef = useRef<Network | null>(null);
    const didInitialFitRef = useRef(false);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [layoutName, setLayoutName] = useState<'preset' | 'physics' | 'hierarchical'>('preset');
    const [visReady, setVisReady] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] }>(() => ({
        nodes: initialGraph.nodes,
        edges: initialGraph.edges,
    }));
    const [graphKey, setGraphKey] = useState(0);

    const [agents, setAgents] = useState<number>(defaultAgents);
    const [activitiesPerAgent, setActivitiesPerAgent] = useState<number>(defaultActivitiesPerAgent);
    const [generatedPerActivity, setGeneratedPerActivity] = useState<number>(defaultGeneratedPerActivity);
    const [usedPerActivity, setUsedPerActivity] = useState<number>(defaultUsedPerActivity);
    const [showEntities, setShowEntities] = useState<boolean>(true);

    useEffect(() => {
        setVisReady(true);
        setMounted(true);
    }, []);

    const graph = useMemo(() => ({ nodes: graphData.nodes, edges: graphData.edges }), [graphData]);

    const options: Options = useMemo(() => {
        const levelSeparation = defaultSpacingX;
        const nodeSpacing = 300;
        const treeSpacing = Math.max(40, defaultSpacingX / 1.5);

        const physicsOptions = {
            enabled: true,
            solver: 'forceAtlas2Based',
            stabilization: { enabled: true, iterations: 200, updateInterval: 25 },
            forceAtlas2Based: {
                gravitationalConstant: -50,
                centralGravity: 0.01,
                springLength: Math.round(defaultSpacingX / 1.5),
                springConstant: 0.08,
                avoidOverlap: 0.5,
            },
        };

        const hierarchicalLayout = {
            hierarchical: {
                direction: 'UD',
                sortMethod: 'directed',
                edgeMinimization: true,
                blockShifting: true,
                parentCentralization: false,
                levelSeparation,
                nodeSpacing,
                treeSpacing,
            },
            improvedLayout: true,
        };

        return {
            layout: layoutName === 'hierarchical' ? hierarchicalLayout : { improvedLayout: true },
            physics: layoutName === 'physics' ? physicsOptions : false,
            nodes: { shape: 'box', size: 8, color: { background: '#60a5fa' }, font: { size: 10 } },
            edges: { color: '#9ca3af', width: 1, smooth: { enabled: true, type: 'continuous', roundness: 0.5 } },
            interaction: { hover: true, multiselect: true },
            autoResize: true,
        };
    }, [layoutName]);

    const events = useMemo(
        () => ({
            selectNode: (params: unknown) => {
                const p = params as { nodes?: string[] };
                const ids = (p.nodes ?? []) as string[];
                setSelectedIds(ids);
            },
            dragEnd: () => {
                const network = networkRef.current;
                if (!network) {
                    return;
                }
                const ids = network.getSelectedNodes().map(String);
                setSelectedIds(ids);
            },
            deselectNode: () => setSelectedIds([]),
        }),
        [],
    );

    const getNetwork = (n: Network) => {
        networkRef.current = n;

        if (!didInitialFitRef.current) {
            n.fit({ animation: false });
            didInitialFitRef.current = true;
        }
        if (layoutName === 'physics') {
            setTimeout(() => n.stabilize(), 50);
        }
    };

    const runLayout = (name?: typeof layoutName) => {
        const n = networkRef.current;
        if (!n) {
            return;
        }
        const mode = name ?? layoutName;

        if (mode === 'preset') {
            n.fit({ animation: true });
            return;
        }

        if (mode === 'physics') {
            n.stabilize();
            return;
        }

        n.stabilize();
    };

    const regenerate = () => {
        setLayoutName('preset');
        const g = createDummyProvData({
            agents,
            activitiesPerAgent,
            generatedPerActivity,
            usedPerActivity,
            spacingX: defaultSpacingX,
        });

        setTimeout(() => {
            setGraphData({ nodes: g.nodes, edges: g.edges });
            setGraphKey((k) => k + 1);
            setSelectedIds([]);
        }, 0);
    };

    const toggleShowEntities = (show: boolean) => {
        setShowEntities(show);
        const newNodes = graphData.nodes.map((n) => ({
            ...(n as Node),
            hidden: !show && String((n as Node).id).startsWith('ent-'),
        }));
        const newEdges = graphData.edges.map((e) => ({
            ...(e as Edge),
            hidden: !show && (String(e.from).startsWith('ent-') || String(e.to).startsWith('ent-')),
        }));
        setGraphData({ nodes: newNodes, edges: newEdges });
        setGraphKey((k) => k + 1);
    };

    const selectedNodeObjects = useMemo(() => {
        return selectedIds
            .map((id) => graphData.nodes.find((n) => String((n as Node).id) === String(id)))
            .filter(Boolean);
    }, [selectedIds, graphData]);

    const [controlsOpen, setControlsOpen] = useState(false);

    return (
        <div style={{ display: 'flex', gap: 8, height: '85vh' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                {!visReady && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 24,
                            top: 96,
                            zIndex: 10,
                            background: '#fff',
                            padding: 8,
                            borderRadius: 6,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Loader className='w-5 h-5 animate-spin' />
                            <span style={{ color: '#6b7280' }}>Loading network...</span>
                        </div>
                    </div>
                )}

                <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
                    {mounted && (
                        <Graph key={graphKey} graph={graph} options={options} events={events} getNetwork={getNetwork} />
                    )}
                </div>
            </div>

            <div className='md:hidden absolute top-4 right-4 z-30'>
                {!controlsOpen && (
                    <button
                        onClick={() => setControlsOpen(true)}
                        className='
        p-2    
        text-sm
        rounded-full
        hover:bg-gray-300 
        transition-colors  
        cursor-pointer
      '
                        aria-label='Open Controls'
                    >
                        Controls
                    </button>
                )}
            </div>

            <div
                className={`
        fixed md:static
        top-0 right-0
        h-full md:h-auto
        max-h-[85vh]
        w-72 md:w-80
        bg-white border-l border-gray-200
        overflow-auto
        p-4
        transition-transform duration-300
        z-10

        ${controlsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
    `}
            >
                <div className=' flex items-center justify-between mb-4'>
                    <h3 className='mt-0 text-lg font-semibold'>Controls</h3>
                    <button
                        onClick={() => setControlsOpen(false)}
                        className=' md:hidden
      p-1 bg-gray-200 rounded-full hover:bg-gray-300 
      transition-colors cursor-pointer
    '
                        aria-label='Close Controls'
                    >
                        <X size={16} className='text-red-500' />
                    </button>
                </div>

                <div className='mb-3'>
                    <div className='flex gap-2 mb-2'>
                        <label className='flex items-center gap-2 text-sm'>
                            <span>Agents</span>
                            <input
                                type='number'
                                min={1}
                                max={500}
                                value={agents}
                                onChange={(e) => setAgents(Math.max(1, Number(e.target.value) || 1))}
                                className='w-20 px-2 py-1 border rounded'
                            />
                        </label>

                        <label className='flex items-center gap-2 text-sm'>
                            <span>Activities / agent</span>
                            <input
                                type='number'
                                min={1}
                                max={1000}
                                value={activitiesPerAgent}
                                onChange={(e) => setActivitiesPerAgent(Math.max(1, Number(e.target.value) || 1))}
                                className='w-20 px-2 py-1 border rounded'
                            />
                        </label>
                    </div>

                    <div className='flex gap-2 mb-2'>
                        <label className='flex items-center gap-2 text-sm'>
                            <span>Generated / activity</span>
                            <input
                                type='number'
                                min={0}
                                max={10}
                                value={generatedPerActivity}
                                onChange={(e) => setGeneratedPerActivity(Math.max(0, Number(e.target.value) || 0))}
                                className='w-20 px-2 py-1 border rounded'
                            />
                        </label>

                        <label className='flex items-center gap-2 text-sm'>
                            <span>Used / activity</span>
                            <input
                                type='number'
                                min={0}
                                max={10}
                                value={usedPerActivity}
                                onChange={(e) => setUsedPerActivity(Math.max(0, Number(e.target.value) || 0))}
                                className='w-20 px-2 py-1 border rounded'
                            />
                        </label>
                    </div>

                    <label className='block mb-2 text-sm'>
                        <span className='mr-2'>Layout</span>
                        <select
                            value={layoutName}
                            onChange={(e) => setLayoutName(e.target.value as 'preset' | 'physics' | 'hierarchical')}
                            className='px-2 py-1 border rounded'
                        >
                            <option value='preset'>preset (keep grid positions)</option>
                            <option value='physics'>physics (auto)</option>
                            <option value='hierarchical'>hierarchical</option>
                        </select>
                    </label>
                    <div className='flex gap-2'>
                        <button onClick={() => runLayout()} className='px-3 py-1 bg-blue-600 text-white rounded'>
                            Run layout
                        </button>
                        <button onClick={regenerate} className='px-3 py-1 bg-gray-200 rounded'>
                            Regenerate
                        </button>
                    </div>
                </div>

                <h3 className='mt-4 mb-2'>Selected node metadata</h3>
                {selectedNodeObjects.length > 0 ? (
                    selectedNodeObjects.map((sn) => {
                        const node = sn as unknown as { id?: string | number; label?: string; x?: number; y?: number };
                        return (
                            <div key={String(node.id)} style={{ marginBottom: 12 }}>
                                <p>
                                    <strong>id:</strong> {String(node.id)}
                                </p>
                                <p>
                                    <strong>label:</strong> {String(node.label ?? '')}
                                </p>
                                <p>
                                    <strong>position:</strong>{' '}
                                    {`x: ${Math.round(node.x ?? 0)}, y: ${Math.round(node.y ?? 0)}`}
                                </p>
                                <details>
                                    <summary>Raw data</summary>
                                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(node, null, 2)}</pre>
                                </details>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ color: '#6b7280' }}>Select one or more nodes to see metadata</div>
                )}
                <div className='sticky bottom-0 bg-white py-2 mt-3 flex justify-end'>
                    <label className='flex items-center gap-2 text-sm'>
                        <input
                            type='checkbox'
                            checked={showEntities}
                            onChange={(e) => toggleShowEntities(e.target.checked)}
                            className='w-4 h-4'
                        />
                        <span>Show entities</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
