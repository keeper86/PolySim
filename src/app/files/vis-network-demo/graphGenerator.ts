import type { Edge, Node } from 'vis';

export function createDummyProvData({
    agents = 2,
    activitiesPerAgent = 4,
    generatedPerActivity = 1,
    usedPerActivity = 2,
    spacingX = 160,
    spacingY = 72,
    startX = 50,
    startY = 50,
}: {
    agents?: number;
    activitiesPerAgent?: number;
    generatedPerActivity?: number;
    usedPerActivity?: number;
    spacingX?: number;
    spacingY?: number;
    startX?: number;
    startY?: number;
}) {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const successRateOfLinking = 0.3;

    let entityCounter = 1;

    const agentIds: string[] = [];
    for (let a = 0; a < agents; a++) {
        const id = `agent-${a}`;
        agentIds.push(id);
        nodes.push({
            id,
            label: `Agent ${a + 1}`,
            x: startX + a * spacingX,
            y: startY - spacingY,
            shape: 'ellipse',
            color: { background: '#60a5fa' },
            font: { size: 12 },
        } as Node);
    }

    const entityPool: string[] = [];

    const producerByEntity: Record<string, string | undefined> = {};

    for (let a = 0; a < agents; a++) {
        const agentId = agentIds[a];
        for (let ai = 0; ai < activitiesPerAgent; ai++) {
            const actId = `act-${a}-${ai}`;
            const actX = startX + a * spacingX;
            const actY = startY + ai * spacingY;

            nodes.push({
                id: actId,
                label: `Activity ${a + 1}.${ai + 1}`,
                x: actX,
                y: actY,
                shape: 'box',
                color: { background: '#34d399' },
                font: { size: 11 },
            } as Node);

            edges.push({ id: `e-${agentId}-${actId}`, from: agentId, to: actId, arrows: 'to' });

            for (let u = 0; u < usedPerActivity; u++) {
                if (entityPool.length === 0) {
                    break;
                }
                const existing = entityPool[Math.floor(Math.random() * entityPool.length)];

                if (Math.random() > successRateOfLinking) {
                    continue;
                }
                if (!existing) {
                    break;
                }

                edges.push({
                    id: `e-used-${actId}-${existing}-${u}`,
                    from: existing,
                    to: actId,
                    arrows: 'to',
                    label: 'used',
                    color: { color: '#f59e0b' },
                } as Edge);

                const producer = producerByEntity[existing];
                if (producer && producer !== actId) {
                    const infId = `e-inf-${producer}-${actId}-${existing}`;

                    if (!edges.some((ee) => ee.id === infId)) {
                        edges.push({
                            id: infId,
                            from: producer,
                            to: actId,
                            arrows: 'to',
                            label: 'informedBy',
                            color: { color: '#7c3aed' },
                        } as Edge);
                    }
                }
            }

            const newEntitiesThisActivity: string[] = [];
            for (let g = 0; g < generatedPerActivity; g++) {
                const entId = `ent-${entityCounter++}`;
                newEntitiesThisActivity.push(entId);

                const offsetX = (g % 2 === 0 ? -1 : 1) * Math.min(60, Math.floor(g / 2) * 16 + 20);
                const offsetY = (Math.floor(g / 2) % 2 === 0 ? -1 : 1) * 12;
                nodes.push({
                    id: entId,
                    label: `Entity ${entId.replace('ent-', '')}`,
                    x: actX + offsetX,
                    y: actY + spacingY / 3 + offsetY,
                    shape: 'ellipse',
                    color: { background: '#d1d5db' },
                    font: { size: 10 },
                } as Node);
                edges.push({
                    id: `e-gen-${actId}-${entId}`,
                    from: actId,
                    to: entId,
                    arrows: 'to',
                    label: 'generated',
                    color: { color: '#10b981' },
                } as Edge);

                producerByEntity[entId] = actId;
            }

            for (const ne of newEntitiesThisActivity) {
                entityPool.push(ne);
            }
        }
    }

    return { nodes, edges };
}
