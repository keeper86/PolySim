import {EnergyForecast} from '../components/client/EnergyForecast';

export default async function Home() {
    return (
        <div className='container mx-auto p-4'>
            <h1 className='text-3xl font-bold mb-8 text-center'>PolySim - Event Chain im Web</h1>

            <div className='bg-white p-4 rounded-lg shadow-lg'>
                <EnergyForecast />
            </div>
        </div>
    );
}
