import { useLogger } from '@/hooks/useLogger';
import { useTRPCClient } from '@/lib/trpc';
import type { SkillsAssessmentSchema } from '@/server/controller/skillsAssessment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

const publishSkillsAssessmentKey = 'publish-skills-assessment';

export function usePublishSkillsAssessment() {
    const logger = useLogger('usePublishSkillsAssessment');
    const userId = useSession().data?.user?.id;
    const trpcClient = useTRPCClient();
    const queryClient = useQueryClient();

    const { data: publishStatus = false, isLoading: isPublishStatusLoading } = useQuery({
        queryKey: [publishSkillsAssessmentKey],
        queryFn: async () => {
            logger.debug('Fetching publish skills assessment status');
            const result = await trpcClient.getUser.query({
                userId,
            });
            return result?.hasAssessmentPublished ?? false;
        },
    });

    const mutateAssessmentPublishStatus = useMutation({
        mutationFn: async (newPublishStatus: boolean) => {
            logger.debug('Saving skills assessment publish status', { newPublishStatus });
            await trpcClient.updateUser.mutate({ hasAssessmentPublished: newPublishStatus });
            return newPublishStatus;
        },

        onMutate: async (newPublishStatus) => {
            await queryClient.cancelQueries({ queryKey: [publishSkillsAssessmentKey] });

            const previousData = queryClient.getQueryData<SkillsAssessmentSchema>([publishSkillsAssessmentKey]);

            queryClient.setQueryData([publishSkillsAssessmentKey], newPublishStatus);

            return { previousData };
        },

        onError: (error, _newData, context) => {
            logger.error('Failed to save publish status', { error });

            if (context?.previousData) {
                queryClient.setQueryData([publishSkillsAssessmentKey], context.previousData);
            }
        },
    });

    return {
        publishStatus,
        isPublishStatusLoading,
        mutateAssessmentPublishStatus,
    };
}
