import { useLogger } from '@/hooks/useLogger';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function usePublishSkillsAssessment() {
    const logger = useLogger('usePublishSkillsAssessment');
    const userId = useSession().data?.user?.id;
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const getUserQueryOptions = trpc.getUser.queryOptions({ userId });
    const getUserQuery = useQuery(getUserQueryOptions);

    const publishStatus = getUserQuery.data?.hasAssessmentPublished ?? false;
    const isPublishStatusLoading = getUserQuery.isLoading;

    const updateUserMutation = useMutation(trpc.updateUser.mutationOptions());

    const mutateAssessmentPublishStatus = useMutation({
        mutationFn: async (newPublishStatus: boolean) => {
            logger.debug('Saving skills assessment publish status', { newPublishStatus });
            await updateUserMutation.mutateAsync({ hasAssessmentPublished: newPublishStatus });
            return newPublishStatus;
        },

        onMutate: async (newPublishStatus) => {
            await queryClient.cancelQueries({ queryKey: getUserQueryOptions.queryKey });

            const previousData = queryClient.getQueryData(getUserQueryOptions.queryKey);

            if (previousData) {
                queryClient.setQueryData(getUserQueryOptions.queryKey, {
                    ...previousData,
                    hasAssessmentPublished: newPublishStatus,
                });
            }

            return { previousData };
        },

        onError: (error, _newData, context) => {
            logger.error('Failed to save publish status', { error });

            if (context?.previousData) {
                queryClient.setQueryData(getUserQueryOptions.queryKey, context.previousData);
            }
        },

        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: getUserQueryOptions.queryKey });
        },
    });

    return {
        publishStatus,
        isPublishStatusLoading,
        mutateAssessmentPublishStatus,
    };
}
