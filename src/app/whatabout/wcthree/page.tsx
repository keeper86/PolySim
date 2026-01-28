// typescript
import Link from 'next/link';

export default function WhataboutTestPage() {
    return (
        <article className='p-6 max-w-3xl mx-auto leading-relaxed'>
            <p className='mb-4'>
                The W3C PROV standard provides a framework for provenance data, which answers the core questions of what
                existed, what happened to it, and who or what was responsible over time. Especially in complex
                scientific workflows that depend on various input datasets, parameters, and software versions,
                structured provenance is essential. Without such a structure, results become intractable, and trust as
                well as auditability decrease significantly. PROV solves these problems by providing an unambiguous,
                machine-readable, and reusable way to describe processes.
            </p>

            <p className='mb-4'>
                One of the main challenges in practice is that naming is difficult; different teams often use different
                terms like job versus task for the same concepts. PROV standardizes these names and relationships to
                prevent semantic drift and serves as a shared abstraction layer between humans and machines. The PROV
                family includes several parts: PROV-DM as the underlying data model, PROV-N as a human-readable
                notation, and PROV-O as the formal ontology.
            </p>

            <p className='mb-4'>
                The PROV-DM data model represents provenance as a graph consisting of three types of nodes: Entities
                (things like data or parameters), Activities (processes occurring over time), and Agents (responsible
                people or software). These are connected via typed relationships, such as used (Activity to Entity),
                wasGeneratedBy (Entity to Activity), and wasAssociatedWith (Activity to Agent). The model is extensible
                through fixed core concepts and reserved attributes like prov:type and prov:role, allowing for
                domain-specific specializations without inventing new core structures.
            </p>

            <p className='mb-4'>
                In the PolySim architecture, PROV-DM is implemented using a relational database where tables represent
                core concepts and join tables represent relationships. Since storage is considered an implementation
                detail, the system remains interoperable as long as it preserves PROV semantics. By mapping SQL tables
                to PROV-O triples, the system can integrate with existing PROV tools and SPARQL endpoints. Ultimately,
                the current visualization approach already reflects the PROV mental model by treating provenance as a
                graph of nodes and edges.
            </p>
            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </article>
    );
}
