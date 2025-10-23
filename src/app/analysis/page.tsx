import { EnergyForecast } from './components/EnergyForecast';

export default function AnalysisPage() {
    return (
        <div className='space-y-4'>
            <h1 className='text-2xl font-bold'>Analysis</h1>
            <div className='alert alert-info'>Analysis tools coming soon.</div>
            <EnergyForecast />
        </div>
    );
}
