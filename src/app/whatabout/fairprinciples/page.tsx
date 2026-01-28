// typescript
import Link from 'next/link';

export default function WhataboutTestPage() {
    return (
        <article className='p-6 max-w-3xl mx-auto leading-relaxed'>
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
            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </article>
    );
}
