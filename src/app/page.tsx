import { Page } from '@/components/client/Page';
import Image from 'next/image';

export default function LandingPage() {
    return (
        <Page title='Polysim'>
            <h1>
                <strong>What we want to achieve:</strong>
            </h1>

            <p>
                A (published) research artefact can be assigned a chain of metadata that clarifies how this artefact
                came about. In the best case we have full information to easily reproduce results (even if that would be
                unreasonable in case of too much compute involved). We want to encourage to make simulation code that
                produced published results to be accessible.
            </p>

            <section>
                <p>
                    As a researcher, I want to have a system that make it easy to organize simulation code and data in a
                    convenient way such that all data can be traced back to the version of code that produced the
                    result. It should be easier than managing some arbitrary folder structure.
                </p>
            </section>
            <h1>
                <strong>Provenance and Governance</strong>
            </h1>
            <p>
                <strong>Provenance</strong> is what happened.
                <strong>Governance</strong> ensures it always happens the right way. Provenance should happen by design,
                not by enforcement. The best governance system is the one that users adopt willingly because it
                simplifies their workflow, not because they are required to use it. Convenience drives adoption.
            </p>

            <section>
                <Image
                    src='/images/provenance-poc.png'
                    alt='Whatabout — Provenance and Governance'
                    width={800}
                    height={600}
                    className='w-full max-w-md rounded shadow-md mb-4'
                    priority
                    unoptimized
                />
            </section>
            <h1>
                <strong>W3C PROV Standard</strong>
            </h1>
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

            <h1>
                <strong>FAIR Principles</strong>
            </h1>

            <p className='mb-4'>
                The FAIR principles consist of a set of guidelines comprising the four pillars: Findable, Accessible,
                Interoperable, and Reusable. Their goal is to manage scientific artifacts and research data in a way
                that they can be easily discovered, understood, and reused by both humans and machines. The focus lies
                on transparency and good data management rather than enforcing any specific technology.
            </p>

            <p className='mb-4'>
                In detail, Findability means that data and artifacts must have unique, persistent identifiers (such as
                UUIDs or artifact IDs) and rich metadata. Accessibility is ensured through the use of standard protocols
                like APIs or URLs, whereby metadata remains available even if the actual data is gone. For
                Interoperability, it is crucial that data and metadata use standardized vocabularies or ontologies so
                that machines can understand and integrate them. Reusability is ultimately achieved through
                well-described data that enables future use.
            </p>

            <p className='mb-4'>
                A central tool for implementing these principles is the W3C PROV standard, an ontology for describing
                the origin and lineage of data. While FAIR provides the high-level principles, PROV delivers the
                necessary structure by defining Entities, Activities, Agents, and their relationships. In combination,
                for example, IDs lead to Findability, central storage ensures Accessibility, standardized metadata
                enables Interoperability, and the documentation of parameters and environments ensures Reusability.
            </p>

            <p className='mb-4'>
                The PolySim system utilizes this framework to design simulations according to FAIR principles. It makes
                simulations Findable by capturing metadata such as code versions and environment settings linked to
                unique run IDs. Accessibility is guaranteed through a central server that stores this information for
                later retrieval. By using W3C PROV-O as a metadata model, PolySim achieves Interoperability with other
                research tools and workflows. Finally, Reusability is ensured by capturing everything necessary to
                reproduce a result—from the code to the analysis scripts.
            </p>
        </Page>
    );
}
