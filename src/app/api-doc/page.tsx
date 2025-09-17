import { getApiDocs } from '../../util/swagger';
import ReactSwagger from './swaggerUi';

export default async function IndexPage() {
    const spec = await getApiDocs();
    return (
        <section className='container'>
            <ReactSwagger spec={spec} />
        </section>
    );
}
