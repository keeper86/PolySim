import spec from '../../util/swagger-spec.json';
import SwaggerUi from './swaggerUi';

export default async function IndexPage() {
    return (
        <section className='container'>
            <SwaggerUi spec={spec} />
        </section>
    );
}
