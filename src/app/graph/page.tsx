'use client';
import { LoadingState } from '@/components/client/LoadingState';
import { useProvGraph } from '@/app/graph/useProvGraph';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Network, Options } from 'react-graph-vis';
import Graph from 'react-graph-vis';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import type { Node, Edge } from 'react-graph-vis';
import { GraphControlSidebar } from './graphControl';

type QueryType = 'full' | 'lineage' | 'descendants' | 'commonAncestors';

export default function VisNetworkDemoPage() {
    const networkRef = useRef<Network | null>(null);
    const didInitialFitRef = useRef(false);
    const [mounted, setMounted] = useState(false);
    const [queryType, setQueryType] = useState<QueryType>('full');
    const [entityId, setEntityId] = useState('');
    const [entityId2, setEntityId2] = useState('');
    const [maxDepth, setMaxDepth] = useState('10');
    const [includeMetadata, setIncludeMetadata] = useState(false);
    const [executeQuery, setExecuteQuery] = useState(false);
    const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; type: string } | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        nodeId: string;
        nodeLabel: string;
        nodeType: string;
    } | null>(null);

    const trpc = useTRPC();

    // Full graph query
    const { graphData: fullGraphData, isLoading: isLoadingFull } = useProvGraph(500);

    // Lineage query
    const { data: lineageData, isLoading: isLoadingLineage } = useQuery(
        trpc.getEntityLineage.queryOptions(
            {
                entityId,
                maxDepth: maxDepth ? parseInt(maxDepth) : undefined,
                includeMetadata,
            },
            { enabled: queryType === 'lineage' && executeQuery && !!entityId },
        ),
    );

    // Descendants query
    const { data: descendantsData, isLoading: isLoadingDescendants } = useQuery(
        trpc.getEntityDescendants.queryOptions(
            {
                entityId,
                maxDepth: maxDepth ? parseInt(maxDepth) : undefined,
                includeMetadata,
            },
            { enabled: queryType === 'descendants' && executeQuery && !!entityId },
        ),
    );

    // Common ancestors query
    const { data: commonAncestorsData, isLoading: isLoadingCommonAncestors } = useQuery(
        trpc.getCommonAncestors.queryOptions(
            {
                entityId1: entityId,
                entityId2: entityId2,
                maxDepth: maxDepth ? parseInt(maxDepth) : undefined,
                includeMetadata,
            },
            { enabled: queryType === 'commonAncestors' && executeQuery && !!entityId && !!entityId2 },
        ),
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    // Convert lineage query results to graph format (use raw IDs)
    const lineageGraphData = useMemo(() => {
        const data =
            queryType === 'lineage' ? lineageData : queryType === 'descendants' ? descendantsData : commonAncestorsData;

        if (!data) {
            return { nodes: [], edges: [] };
        }

        const nodes: Node[] = data.nodes.map((n) => ({
            id: String(n.id),
            label: n.label ?? String(n.id),
            group: n.nodeType,
            title: includeMetadata && n.metadata ? JSON.stringify(n.metadata, null, 2) : undefined,
        }));

        const edges: Edge[] = data.edges.map((e) => ({
            from: String(e.from),
            to: String(e.to),
            label: e.relationshipType,
            group: 'structural',
            arrows: 'to',
        }));

        return { nodes, edges };
    }, [lineageData, descendantsData, commonAncestorsData, queryType, includeMetadata]);

    const isLoading = isLoadingFull || isLoadingLineage || isLoadingDescendants || isLoadingCommonAncestors;
    const graphData = queryType === 'full' ? fullGraphData : lineageGraphData;

    // Create stable key for graph - only changes when query type or data changes
    const graphKey = useMemo(() => {
        return `${queryType}-${graphData.nodes.length}-${graphData.edges.length}`;
    }, [queryType, graphData.nodes.length, graphData.edges.length]);

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
            interaction: { hover: true, multiselect: true, hideEdgesOnDrag: false },
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

        // Add click event for node selection
        n.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0] as string;
                const node = graphData.nodes.find((n) => n.id === nodeId);
                if (node) {
                    setSelectedNode({
                        id: nodeId,
                        label: node.label || nodeId,
                        type: node.group || 'unknown',
                    });
                }
            } else {
                setSelectedNode(null);
            }
        });

        // Add right-click context menu for entities only
        n.on('oncontext', (params) => {
            params.event.preventDefault();

            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0] as string;
                const node = graphData.nodes.find((n) => n.id === nodeId);

                // Only show context menu for entities
                if (node && node.group === 'entity') {
                    setContextMenu({
                        x: params.pointer.DOM.x,
                        y: params.pointer.DOM.y,
                        nodeId: nodeId,
                        nodeLabel: node.label || nodeId,
                        nodeType: node.group || 'entity',
                    });
                }
            }
        });
    };

    // Close context menu on regular click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // No ID prefixing — server and client use raw IDs

    const handleContextMenuAction = (action: 'lineage' | 'descendants' | 'setAsEntity1' | 'setAsEntity2') => {
        if (!contextMenu) {
            return;
        }

        switch (action) {
            case 'lineage':
                setQueryType('lineage');
                // Server expects raw ID, contextMenu.nodeId is the raw ID
                setEntityId(contextMenu.nodeId);
                handleRunQuery();
                break;
            case 'descendants':
                setQueryType('descendants');
                setEntityId(contextMenu.nodeId);
                handleRunQuery();
                break;
            case 'setAsEntity1':
                setEntityId(contextMenu.nodeId);
                if (queryType !== 'commonAncestors') {
                    setQueryType('commonAncestors');
                }
                break;
            case 'setAsEntity2':
                setEntityId2(contextMenu.nodeId);
                if (queryType !== 'commonAncestors') {
                    setQueryType('commonAncestors');
                }
                break;
        }
        setContextMenu(null);
    };

    const handleRunQuery = () => {
        didInitialFitRef.current = false;
        setExecuteQuery(true);
        setTimeout(() => setExecuteQuery(false), 100);
    };

    if (isLoading) {
        return <LoadingState message='Loading graph data...' />;
    }

    return (
        <div className='flex gap-4 h-[85vh]'>
            <div className='w-80 overflow-y-auto border-r p-4 space-y-4'>
                <div>
                    <h2 className='text-lg font-semibold mb-2'>Lineage Query Tester</h2>
                    <p className='text-sm text-muted-foreground mb-4'>
                        Right-click entities in the graph to run lineage queries
                    </p>
                </div>

                {/* Usage Instructions */}
                <div className='p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs space-y-2'>
                    <p className='font-medium'>How to use:</p>
                    <ul className='space-y-1 text-muted-foreground'>
                        <li>
                            • <strong>Left-click</strong> a node to select it
                        </li>
                        <li>
                            • <strong>Right-click</strong> an entity to open menu
                        </li>
                        <li>• Choose lineage or descendants query</li>
                        <li>• Use &quot;Set as Entity 1/2&quot; for common ancestors</li>
                    </ul>
                </div>

                {/* Selected Node Display */}
                {selectedNode && (
                    <div className='p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
                        <div className='flex justify-between items-start mb-1'>
                            <p className='text-xs font-medium text-blue-900 dark:text-blue-100'>Selected Node</p>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs'
                            >
                                Clear
                            </button>
                        </div>
                        <p className='text-sm font-mono text-blue-900 dark:text-blue-100 break-all'>
                            {selectedNode.label}
                        </p>
                        <p className='text-xs text-blue-700 dark:text-blue-300 mt-1'>Type: {selectedNode.type}</p>
                    </div>
                )}

                <div className='space-y-2'>
                    <label className='text-sm font-medium'>Query Type</label>
                    <select
                        className='w-full p-2 border rounded'
                        value={queryType}
                        onChange={(e) => setQueryType(e.target.value as QueryType)}
                    >
                        <option value='full'>Full Graph</option>
                        <option value='lineage'>Entity Lineage (Backward)</option>
                        <option value='descendants'>Entity Descendants (Forward)</option>
                        <option value='commonAncestors'>Common Ancestors</option>
                    </select>
                </div>

                {queryType !== 'full' && (
                    <>
                        <div className='space-y-2'>
                            <label className='text-sm font-medium'>
                                Entity ID {queryType === 'commonAncestors' && '1'}
                            </label>
                            <input
                                type='text'
                                className='w-full p-2 border rounded'
                                placeholder='e.g., output.txt'
                                value={entityId}
                                onChange={(e) => setEntityId(e.target.value)}
                            />
                        </div>

                        {queryType === 'commonAncestors' && (
                            <div className='space-y-2'>
                                <label className='text-sm font-medium'>Entity ID 2</label>
                                <input
                                    type='text'
                                    className='w-full p-2 border rounded'
                                    placeholder='e.g., output2.txt'
                                    value={entityId2}
                                    onChange={(e) => setEntityId2(e.target.value)}
                                />
                            </div>
                        )}

                        <div className='space-y-2'>
                            <label className='text-sm font-medium'>Max Depth (optional)</label>
                            <input
                                type='number'
                                className='w-full p-2 border rounded'
                                placeholder='10'
                                value={maxDepth}
                                onChange={(e) => setMaxDepth(e.target.value)}
                            />
                        </div>

                        <div className='flex items-center space-x-2'>
                            <input
                                type='checkbox'
                                id='metadata'
                                checked={includeMetadata}
                                onChange={(e) => setIncludeMetadata(e.target.checked)}
                                className='rounded'
                            />
                            <label htmlFor='metadata' className='text-sm font-medium'>
                                Include Metadata
                            </label>
                        </div>

                        <button
                            onClick={handleRunQuery}
                            disabled={!entityId || (queryType === 'commonAncestors' && !entityId2)}
                            className='w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                        >
                            Run Query
                        </button>

                        <div className='text-xs text-muted-foreground space-y-1 pt-2 border-t'>
                            <p>
                                <strong>Examples:</strong>
                            </p>
                            <p>• Lineage: Find all ancestors of an entity</p>
                            <p>• Descendants: Find all derived entities</p>
                            <p>• Common Ancestors: Find shared lineage</p>
                        </div>
                    </>
                )}

                {queryType !== 'full' && lineageGraphData.nodes.length > 0 && (
                    <div className='pt-4 border-t'>
                        <p className='text-sm font-medium'>Results:</p>
                        <p className='text-sm text-muted-foreground'>
                            {lineageGraphData.nodes.length} nodes, {lineageGraphData.edges.length} edges
                        </p>
                    </div>
                )}
            </div>

            {/* Graph Visualization */}
            <div className='flex-1 min-h-0 relative'>
                <div className='w-full h-full min-h-[400px]'>
                    {mounted && <Graph key={graphKey} graph={graphData} options={options} getNetwork={getNetwork} />}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        className='absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[200px] z-50'
                        style={{
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className='px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700'>
                            <div className='font-medium text-gray-900 dark:text-gray-100 truncate'>
                                {contextMenu.nodeLabel}
                            </div>
                            <div className='text-gray-500 dark:text-gray-400'>Entity</div>
                        </div>
                        <button
                            onClick={() => handleContextMenuAction('lineage')}
                            className='w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                        >
                            <span>↑</span>
                            <span>Show Lineage (Ancestors)</span>
                        </button>
                        <button
                            onClick={() => handleContextMenuAction('descendants')}
                            className='w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
                        >
                            <span>↓</span>
                            <span>Show Descendants</span>
                        </button>
                        <div className='border-t border-gray-200 dark:border-gray-700 my-1'></div>
                        <button
                            onClick={() => handleContextMenuAction('setAsEntity1')}
                            className='w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                        >
                            Set as Entity 1
                        </button>
                        <button
                            onClick={() => handleContextMenuAction('setAsEntity2')}
                            className='w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
                        >
                            Set as Entity 2
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
