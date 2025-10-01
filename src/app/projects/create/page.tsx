'use client';
import { trpcClient } from '@/app/clientTrpc';
import { useState } from 'react';

export default function ProjectsCreatePage() {
    const [projectName, setProjectName] = useState('');
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
                    trpcClient['projects-create'] //
                        .mutate({ name: projectName })
                }
            >
                Create Project
            </button>
        </div>
    );
}
