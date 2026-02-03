import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import type { Node, Edge } from 'react-graph-vis';

export interface GraphData {
    nodes: Node[];
    edges: Edge[];
}

export function useProvGraph(maxItemsPerType = 500) {
    const trpc = useTRPC();
    const { data: provData, ...queryResult } = useQuery(trpc.getProvGraph.queryOptions({ maxItemsPerType }));

    const graphData: GraphData = useMemo(() => {
        if (!provData) {
            return { nodes: [], edges: [] };
        }

        const getEdgeGroup = (label?: string): string => {
            if (!label) {
                return 'structural';
            }
            const influenceLabels = ['wasInformedBy', 'wasDerivedFrom'];
            return influenceLabels.includes(label) ? 'influence' : 'structural';
        };

        const nodes: Node[] = provData.nodes.map((n) => ({
            id: String(n.id),
            label: n.label ?? String(n.id),
            group: n.group,
        }));

        const edges: Edge[] = provData.edges.map((e) => {
            const group = getEdgeGroup(e.label);
            const baseEdge = {
                from: String(e.from),
                to: String(e.to),
                label: e.label,
                group,
            };

            // Add physics properties based on edge group
            switch (group) {
                case 'influence':
                    return {
                        ...baseEdge,
                        physics: true,
                        length: 200, // Longer spring length for influence edges
                    };
                case 'structural':
                    return {
                        ...baseEdge,
                        physics: true,
                        length: 150, // Standard spring length for structural edges
                    };
                default:
                    return baseEdge;
            }
        });

        return { nodes, edges };
    }, [provData]);

    return {
        graphData,
        ...queryResult,
    };
}
