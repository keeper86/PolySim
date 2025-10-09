import { trpcClient } from '@/app/clientTrpc';
import { clientLogger } from '@/app/clientLogger';
import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    cleanEmptyDefaultSkillsAssessment,
    getDefaultSkillsAssessment,
} from '@/utils/getDefaultAssessmentList';

const childLogger = clientLogger.child('useSkillsAssessment');

export function useSkillsAssessment() {
    const {
        data: queryData,
        isLoading: isInitializing,
        isError: isLoadError,
        error: loadError,
    } = useQuery({
        queryKey: ['skills-assessment'],
        queryFn: async () => {
            childLogger.debug('Fetching skills assessment');
            const result = await trpcClient['skills-assessment-get'].query();
            if (!result || result.length === 0) {
                childLogger.debug('No existing skills assessment found, loading default');
                return getDefaultSkillsAssessment();
            } else {
                childLogger.debug('Loaded existing skills assessment');
                return getDefaultSkillsAssessment(result);
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const saveMutation = useMutation({
        mutationFn: async (dataToSave: SkillsAssessmentSchema) => {
            const cleanedData = cleanEmptyDefaultSkillsAssessment(dataToSave);
            childLogger.debug('Saving skills assessment', { data: cleanedData });
            await trpcClient['skills-assessment-save'].mutate(cleanedData);
        },
        onError: (error: unknown) => {
            toast.error('Failed to save skills assessment', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
            childLogger.error('Failed to save skills assessment', { error });
        },
    });

    return {
        data: queryData,
        isInitializing,
        isLoadError,
        loadError,
        saveMutation,
    };
}
