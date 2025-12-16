'use client';

import { CategorySection } from '@/app/account/skills-assessment/components/CategorySection';
import { ConfirmResetDialog } from '@/app/account/skills-assessment/components/ConfirmResetDialog';
import { RatingScale } from '@/app/account/skills-assessment/components/RatingScale';
import { useSkillsAssessmentActions } from '@/app/account/skills-assessment/hooks/useSkillsAssessmentActions';
import { Page } from '@/components/client/Page';
import { SyncStatusIndicator } from '@/components/client/SyncStatusIndicator';
import LoadingState from '@/components/client/LoadingState';
import ErrorState from '@/components/client/ErrorState';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { usePublishSkillsAssessment } from './hooks/usePublishSkillsAssessment';
import { useSkillsAssessment } from './hooks/useSkillsAssessment';

export default function SkillsAssessmentPage() {
    const { skillsQuery, saveMutation } = useSkillsAssessment();
    const { data: assessment = { data: [] }, isLoading, isError } = skillsQuery;
    const skillAssessmentActions = useSkillsAssessmentActions(assessment, saveMutation);

    const [confirmDelete, setConfirmDelete] = useState<{ categoryIdx: number; itemIndex: number } | null>(null);
    const { publishStatus, isPublishStatusLoading, mutateAssessmentPublishStatus } = usePublishSkillsAssessment();

    if (isLoading) {
        return <LoadingState message='Loading skills assessment…' />;
    }

    if (isError) {
        return (
            <ErrorState
                title='Failed to load'
                description='Failed to load skills assessment. Please try again later.'
            />
        );
    }

    const getSyncStatus = () => {
        if (saveMutation.isPending) {
            return 'pending';
        }
        if (saveMutation.isError) {
            return 'error';
        }
        return 'success';
    };

    const publishSwitch = (
        <>
            {isPublishStatusLoading ? <Spinner className='h-5 w-5 text-muted-foreground' /> : null}
            <Switch
                id='publish-assessment'
                checked={publishStatus}
                onCheckedChange={() => mutateAssessmentPublishStatus.mutate(!publishStatus)}
            />
            <Label htmlFor='publish-assessment'>Publish</Label>
        </>
    );

    return (
        <Page title='Skills Assessment' headerComponent={publishSwitch}>
            <RatingScale />
            <Accordion type='multiple'>
                {assessment.data.map((categoryObj) => (
                    <AccordionItem key={categoryObj.category} value={String(categoryObj.category)}>
                        <AccordionTrigger>
                            <div className='flex items-center justify-between w-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer'>
                                <span className='text-2xl font-semibold capitalize'>{categoryObj.category}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CategorySection categoryObj={categoryObj} actions={skillAssessmentActions} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Button
                onClick={async () => {
                    const json = JSON.stringify(assessment, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'skills-assessment.json';
                    a.click();
                    URL.revokeObjectURL(url);
                }}
                variant='outline'
                className='w-full sm:w-auto mx-auto flex items-center gap-2'
            >
                Download Data as JSON
            </Button>

            <ConfirmResetDialog
                open={!!confirmDelete}
                onCancel={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete) {
                        const { categoryIdx, itemIndex } = confirmDelete;
                        const category = assessment.data[categoryIdx].category;
                        skillAssessmentActions.resetSkillRatings(category, itemIndex);
                        setConfirmDelete(null);
                    }
                }}
            />
            <SyncStatusIndicator status={getSyncStatus()} />
        </Page>
    );
}
