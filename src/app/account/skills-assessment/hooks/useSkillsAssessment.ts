import { useLogger } from '@/hooks/useLogger';
import { useTRPC } from '@/lib/trpc';
import type { SkillsAssessmentSchema } from '@/server/controller/skillsAssessment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cleanEmptyDefaultSkillsAssessment, getDefaultSkillsAssessment } from '../utils/getDefaultAssessmentList';
import { useSession } from 'next-auth/react';

export function useSkillsAssessment() {
    const logger = useLogger('useSkillsAssessment');
    const userId = useSession().data?.user?.id;
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const getSkillsAssessmentQuery = useQuery(trpc.getSkillsAssessment.queryOptions({ userId }));

    const skillsQuery = useQuery({
        queryKey: ['skills-assessment'],
        queryFn: () => {
            logger.debug('Fetching skills assessment');
            const result = getSkillsAssessmentQuery.data;
            if (!result || result.data.length === 0) {
                logger.debug('No existing skills assessment found, loading default');
                return getDefaultSkillsAssessment();
            } else {
                logger.debug('Loaded existing skills assessment');
                return getDefaultSkillsAssessment(result);
            }
        },
        enabled: getSkillsAssessmentQuery.isSuccess,
    });

    const updateSkillsAssessmentMutation = useMutation(trpc.updateSkillsAssessment.mutationOptions());

    const saveMutation = useMutation({
        mutationFn: async (dataToSave: SkillsAssessmentSchema) => {
            const cleanedData = cleanEmptyDefaultSkillsAssessment(dataToSave);
            logger.debug('Saving skills assessment', { data: cleanedData });
            await updateSkillsAssessmentMutation.mutateAsync(cleanedData);
            return dataToSave;
        },

        onMutate: async (newData) => {
            await queryClient.cancelQueries({ queryKey: ['skills-assessment'] });

            const previousData = queryClient.getQueryData<SkillsAssessmentSchema>(['skills-assessment']);

            queryClient.setQueryData(['skills-assessment'], getDefaultSkillsAssessment(newData));

            return { previousData };
        },

        onError: (error, _newData, context) => {
            logger.error('Failed to save skills assessment', { error });

            if (context?.previousData) {
                queryClient.setQueryData(['skills-assessment'], getDefaultSkillsAssessment(context.previousData));
            }
        },
    });

    return {
        skillsQuery,
        saveMutation,
    };
}
