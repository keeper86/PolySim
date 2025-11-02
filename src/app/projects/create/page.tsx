'use client';
import { useTRPCClient } from '@/lib/trpc';
import { useState } from 'react';

export default function ProjectsCreatePage() {
    const [projectName, setProjectName] = useState('');
    const trpcClient = useTRPCClient();
    return (
        <div>
            <h1>Create a New Project</h1>
            <input
                type='text'
                placeholder='Project Name'
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
            />
            <button
                onClick={() =>
                    trpcClient.createProject //
                        .mutate({ name: projectName })
                }
            >
                Create Project
            </button>
        </div>
    );
}
