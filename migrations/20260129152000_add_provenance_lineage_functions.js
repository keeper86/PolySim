/**
 * Migration: Add PostgreSQL stored functions for provenance lineage queries
 *
 * This migration creates three PostgreSQL functions that encapsulate complex
 * recursive Common Table Expression (CTE) queries for provenance graph traversal:
 * - get_entity_lineage: Backward traversal (find ancestors)
 * - get_entity_descendants: Forward traversal (find descendants)
 * - get_common_ancestors: Find common ancestors between two entities
 *
 * These functions improve code maintainability by moving complex SQL logic
 * into the database layer and provide better performance through database-level
 * query optimization.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Function 1: Get Entity Lineage (Activity chain via informedBy)
    // NOTE: This version defines lineage as the chain of activities that the
    // given entity is based on. It starts from the activity(ies) that
    // generated the entity (was_generated_by) and recursively follows
    // activity-to-activity links through the `was_informed_by` relationship.
    // Assumption: DB has a `was_informed_by` table with columns
    // `informed_id` (the activity being informed) and `informer_id` (the
    // activity that informed it).
    await knex.raw(`
    CREATE OR REPLACE FUNCTION get_entity_lineage(
      p_entity_id TEXT,
      p_max_depth INTEGER DEFAULT NULL,
      p_include_metadata BOOLEAN DEFAULT FALSE
    )
    RETURNS TABLE (
      node_id TEXT,
      node_label TEXT,
      node_type TEXT,
      depth INTEGER,
      metadata JSONB,
      edge_from TEXT,
      edge_to TEXT,
      relationship_type TEXT,
      role TEXT,
      path TEXT[]
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      WITH RECURSIVE lineage AS (
        -- Base case: activities that generated the target entity
        SELECT
          a.id as node_id,
          a.label as node_label,
          'activity'::text as node_type,
          0 as depth,
          CASE WHEN p_include_metadata THEN a.metadata ELSE NULL::jsonb END as metadata,
          NULL::text as edge_from,
          NULL::text as edge_to,
          NULL::text as relationship_type,
          NULL::text as role,
          ARRAY[a.id] as path
        FROM activities a
        JOIN was_generated_by wgb ON wgb.activity_id = a.id
        WHERE wgb.entity_id = p_entity_id

        UNION ALL

        -- Recursive case: follow was_informed_by links between activities
        SELECT
          CASE WHEN ib.informed_id = l.node_id THEN ib.informer_id ELSE ib.informed_id END as node_id,
          a2.label as node_label,
          'activity'::text as node_type,
          l.depth + 1 as depth,
          CASE WHEN p_include_metadata THEN a2.metadata ELSE NULL::jsonb END as metadata,
          l.node_id as edge_from,
          CASE WHEN ib.informed_id = l.node_id THEN ib.informer_id ELSE ib.informed_id END as edge_to,
          'informedBy'::text as relationship_type,
          NULL::text as role,
          l.path || CASE WHEN ib.informed_id = l.node_id THEN ib.informer_id ELSE ib.informed_id END as path
        FROM lineage l
        JOIN was_informed_by ib ON ib.informed_id = l.node_id OR ib.informer_id = l.node_id
        JOIN activities a2 ON a2.id = CASE WHEN ib.informed_id = l.node_id THEN ib.informer_id ELSE ib.informed_id END
        WHERE (p_max_depth IS NULL OR l.depth < p_max_depth)
          AND NOT (CASE WHEN ib.informed_id = l.node_id THEN ib.informer_id ELSE ib.informed_id END = ANY(l.path))
      )
      SELECT * FROM lineage
      ORDER BY depth, node_id;
    END;
    $$;
  `);

    // Add database-level documentation for get_entity_lineage
    await knex.raw(`
    COMMENT ON FUNCTION get_entity_lineage(TEXT, INTEGER, BOOLEAN) IS
    'Returns the chain of activities that the specified entity is based on.
    Starts from activity(ies) that generated the entity (was_generated_by) and
  follows activity-to-activity links using the was_informed_by relationship.
    Parameters:
      - p_entity_id: The ID of the entity to trace from
      - p_max_depth: Optional maximum traversal depth (NULL for unlimited)
      - p_include_metadata: Whether to include detailed activity metadata in results
    Returns a linearised activity lineage for the given entity.';
  `); // Function 2: Get Entity Descendants (Forward Traversal)
    await knex.raw(`
    CREATE OR REPLACE FUNCTION get_entity_descendants(
      p_entity_id TEXT,
      p_max_depth INTEGER DEFAULT NULL,
      p_include_metadata BOOLEAN DEFAULT FALSE
    )
    RETURNS TABLE (
      node_id TEXT,
      node_label TEXT,
      node_type TEXT,
      depth INTEGER,
      metadata JSONB,
      edge_from TEXT,
      edge_to TEXT,
      relationship_type TEXT,
      role TEXT,
      path TEXT[]
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      WITH RECURSIVE descendants AS (
        -- Base case: Start with the target entity
        SELECT 
          e.id as node_id,
          e.label as node_label,
          'entity'::text as node_type,
          0 as depth,
          CASE WHEN p_include_metadata THEN e.metadata ELSE NULL::jsonb END as metadata,
          NULL::text as edge_from,
          NULL::text as edge_to,
          NULL::text as relationship_type,
          NULL::text as role,
          ARRAY[e.id] as path
        FROM entities e
        WHERE e.id = p_entity_id
        
        UNION ALL
        
        -- Recursive case: Traverse forward through activities
        -- Alternates between entities and activities
        SELECT 
          CASE 
            WHEN d.node_type = 'entity' THEN a.id
            WHEN d.node_type = 'activity' THEN e.id
          END as node_id,
          CASE 
            WHEN d.node_type = 'entity' THEN a.label
            WHEN d.node_type = 'activity' THEN e.label
          END as node_label,
          CASE 
            WHEN d.node_type = 'entity' THEN 'activity'
            WHEN d.node_type = 'activity' THEN 'entity'
          END::text as node_type,
          d.depth + 1 as depth,
          CASE 
            WHEN p_include_metadata AND d.node_type = 'entity' THEN a.metadata
            WHEN p_include_metadata AND d.node_type = 'activity' THEN e.metadata
            ELSE NULL::jsonb
          END as metadata,
          d.node_id as edge_from,
          CASE 
            WHEN d.node_type = 'entity' THEN a.id
            WHEN d.node_type = 'activity' THEN e.id
          END as edge_to,
          CASE 
            WHEN d.node_type = 'entity' THEN 'used'
            WHEN d.node_type = 'activity' THEN 'wasGeneratedBy'
          END::text as relationship_type,
          u.role,
          d.path || CASE 
            WHEN d.node_type = 'entity' THEN a.id
            WHEN d.node_type = 'activity' THEN e.id
          END as path
        FROM descendants d
        LEFT JOIN used u ON u.entity_id = d.node_id AND d.node_type = 'entity'
        LEFT JOIN activities a ON a.id = u.activity_id
        LEFT JOIN was_generated_by wgb ON wgb.activity_id = d.node_id AND d.node_type = 'activity'
        LEFT JOIN entities e ON e.id = wgb.entity_id
        WHERE (p_max_depth IS NULL OR d.depth < p_max_depth)
          AND CASE 
            WHEN d.node_type = 'entity' THEN a.id
            WHEN d.node_type = 'activity' THEN e.id
          END IS NOT NULL
          AND NOT (CASE 
            WHEN d.node_type = 'entity' THEN a.id
            WHEN d.node_type = 'activity' THEN e.id
          END = ANY(d.path))
      )
      SELECT * FROM descendants
      ORDER BY depth, node_id;
    END;
    $$;
  `);

    // Add database-level documentation for get_entity_descendants
    await knex.raw(`
    COMMENT ON FUNCTION get_entity_descendants(TEXT, INTEGER, BOOLEAN) IS
    'Performs forward provenance traversal to find all descendant entities that were derived from the specified entity.
    Uses recursive CTEs to traverse used and was_generated_by relationships.
    Parameters:
      - p_entity_id: The ID of the entity to trace forwards from
      - p_max_depth: Optional maximum traversal depth (NULL for unlimited)
      - p_include_metadata: Whether to include detailed metadata in results
    Returns a graph of entities connected through activities and agents.';
  `); // Function 3: Get Common Ancestors (Bidirectional Traversal)
    await knex.raw(`
    CREATE OR REPLACE FUNCTION get_common_ancestors(
      p_entity_id_1 TEXT,
      p_entity_id_2 TEXT,
      p_max_depth INTEGER DEFAULT NULL,
      p_include_metadata BOOLEAN DEFAULT FALSE
    )
    RETURNS TABLE (
      node_id TEXT,
      node_label TEXT,
      node_type TEXT,
      depth INTEGER,
      metadata JSONB,
      edge_from TEXT,
      edge_to TEXT,
      relationship_type TEXT,
      role TEXT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      WITH RECURSIVE
        -- First lineage: Trace backwards from entity 1
        lineage1 AS (
          -- Base case
          SELECT 
            e.id as node_id,
            e.label as node_label,
            'entity'::text as node_type,
            0 as depth,
            CASE WHEN p_include_metadata THEN e.metadata ELSE NULL::jsonb END as metadata,
            NULL::text as edge_from,
            NULL::text as edge_to,
            NULL::text as relationship_type,
            NULL::text as role,
            ARRAY[e.id] as path
          FROM entities e
          WHERE e.id = p_entity_id_1
          
          UNION ALL
          
          -- Recursive case
          SELECT 
            CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END as node_id,
            CASE 
              WHEN l.node_type = 'entity' THEN a.label
              WHEN l.node_type = 'activity' THEN e.label
            END as node_label,
            CASE 
              WHEN l.node_type = 'entity' THEN 'activity'
              WHEN l.node_type = 'activity' THEN 'entity'
            END::text as node_type,
            l.depth + 1 as depth,
            CASE 
              WHEN p_include_metadata AND l.node_type = 'entity' THEN a.metadata
              WHEN p_include_metadata AND l.node_type = 'activity' THEN e.metadata
              ELSE NULL::jsonb
            END as metadata,
            l.node_id as edge_from,
            CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END as edge_to,
            CASE 
              WHEN l.node_type = 'entity' THEN 'wasGeneratedBy'
              WHEN l.node_type = 'activity' THEN 'used'
            END::text as relationship_type,
            u.role,
            l.path || CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END as path
          FROM lineage1 l
          LEFT JOIN was_generated_by wgb ON wgb.entity_id = l.node_id AND l.node_type = 'entity'
          LEFT JOIN activities a ON a.id = wgb.activity_id
          LEFT JOIN used u ON u.activity_id = l.node_id AND l.node_type = 'activity'
          LEFT JOIN entities e ON e.id = u.entity_id
          WHERE (p_max_depth IS NULL OR l.depth < p_max_depth)
            AND CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END IS NOT NULL
            AND NOT (CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END = ANY(l.path))
        ),
        -- Second lineage: Trace backwards from entity 2
        lineage2 AS (
          -- Base case
          SELECT 
            e.id as node_id,
            e.label as node_label,
            'entity'::text as node_type,
            0 as depth,
            CASE WHEN p_include_metadata THEN e.metadata ELSE NULL::jsonb END as metadata,
            NULL::text as edge_from,
            NULL::text as edge_to,
            NULL::text as relationship_type,
            NULL::text as role,
            ARRAY[e.id] as path
          FROM entities e
          WHERE e.id = p_entity_id_2
          
          UNION ALL
          
          -- Recursive case
          SELECT 
            CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END as node_id,
            CASE 
              WHEN l.node_type = 'entity' THEN a.label
              WHEN l.node_type = 'activity' THEN e.label
            END as node_label,
            CASE 
              WHEN l.node_type = 'entity' THEN 'activity'
              WHEN l.node_type = 'activity' THEN 'entity'
            END::text as node_type,
            l.depth + 1 as depth,
            CASE 
              WHEN p_include_metadata AND l.node_type = 'entity' THEN a.metadata
              WHEN p_include_metadata AND l.node_type = 'activity' THEN e.metadata
              ELSE NULL::jsonb
            END as metadata,
            l.node_id as edge_from,
            CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END as edge_to,
            CASE 
              WHEN l.node_type = 'entity' THEN 'wasGeneratedBy'
              WHEN l.node_type = 'activity' THEN 'used'
            END::text as relationship_type,
            u.role,
            l.path || CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END as path
          FROM lineage2 l
          LEFT JOIN was_generated_by wgb ON wgb.entity_id = l.node_id AND l.node_type = 'entity'
          LEFT JOIN activities a ON a.id = wgb.activity_id
          LEFT JOIN used u ON u.activity_id = l.node_id AND l.node_type = 'activity'
          LEFT JOIN entities e ON e.id = u.entity_id
          WHERE (p_max_depth IS NULL OR l.depth < p_max_depth)
            AND CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END IS NOT NULL
            AND NOT (CASE 
              WHEN l.node_type = 'entity' THEN a.id
              WHEN l.node_type = 'activity' THEN e.id
            END = ANY(l.path))
        )
      -- Find intersection: nodes in both lineages
      -- Exclude the starting entities themselves
      SELECT DISTINCT
        l1.node_id,
        l1.node_label,
        l1.node_type,
        LEAST(l1.depth, l2.depth) as depth,
        COALESCE(l1.metadata, l2.metadata) as metadata,
        l1.edge_from,
        l1.edge_to,
        l1.relationship_type,
        l1.role
      FROM lineage1 l1
      INNER JOIN lineage2 l2 ON l1.node_id = l2.node_id
      WHERE l1.node_id != p_entity_id_1 AND l1.node_id != p_entity_id_2
      ORDER BY depth, node_id;
    END;
    $$;
  `);

    // Add database-level documentation for get_common_ancestors
    await knex.raw(`
    COMMENT ON FUNCTION get_common_ancestors(TEXT, TEXT, INTEGER, BOOLEAN) IS
    'Finds common ancestor entities that contributed to both specified entities.
    Performs backward traversal from both entities and returns the intersection.
    Parameters:
      - p_entity_id_1: The ID of the first entity
      - p_entity_id_2: The ID of the second entity
      - p_max_depth: Optional maximum traversal depth (NULL for unlimited)
      - p_include_metadata: Whether to include detailed metadata in results
    Returns entities that are ancestors of both input entities, with path information from each.';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Drop functions in reverse order of creation
    await knex.raw('DROP FUNCTION IF EXISTS get_common_ancestors(TEXT, TEXT, INTEGER, BOOLEAN);');
    await knex.raw('DROP FUNCTION IF EXISTS get_entity_descendants(TEXT, INTEGER, BOOLEAN);');
    await knex.raw('DROP FUNCTION IF EXISTS get_entity_lineage(TEXT, INTEGER, BOOLEAN);');
};
