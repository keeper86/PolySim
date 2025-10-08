import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';

const defaultSkillsAssessment = [
    {
        name: 'Programming Languages',
        skills: [
            {
                name: 'JavaScript',
                level: 0,
                subSkills: [
                    { name: 'TypeScript', level: 0 },
                    { name: 'Node.js', level: 0 },
                    { name: 'Deno', level: 0 },
                    { name: 'Bun', level: 0 },
                    { name: 'Express.js', level: 0 },
                    { name: 'React', level: 0 },
                    { name: 'Next.js', level: 0 },
                    { name: 'Remix', level: 0 },
                    { name: 'Vue.js', level: 0 },
                    { name: 'Nuxt.js', level: 0 },
                    { name: 'Svelte', level: 0 },
                    { name: 'SvelteKit', level: 0 },
                    { name: 'Solid.js', level: 0 },
                    { name: 'Astro', level: 0 },
                    { name: 'Angular', level: 0 },
                    { name: 'Playwright', level: 0 },
                    { name: 'Cypress', level: 0 },
                    { name: 'Vitest', level: 0 },
                    { name: 'Jest', level: 0 },
                    { name: 'Mocha', level: 0 },
                    { name: 'Vite', level: 0 },
                    { name: 'esbuild', level: 0 },
                    { name: 'SWC', level: 0 },
                    { name: 'Webpack', level: 0 },
                    { name: 'Rollup', level: 0 },
                    { name: 'ESLint', level: 0 },
                    { name: 'Prettier', level: 0 },
                    { name: 'Redux', level: 0 },
                    { name: 'MobX', level: 0 },
                    { name: 'pnpm', level: 0 },
                    { name: 'yarn', level: 0 },
                    { name: 'npm', level: 0 },
                    { name: 'D3.js', level: 0 },
                    { name: 'Chart.js', level: 0 },
                    { name: 'Three.js', level: 0 },
                ],
            },
            {
                name: 'Python',
                level: 0,
                subSkills: [
                    { name: 'Django', level: 0 },
                    { name: 'FastAPI', level: 0 },
                    { name: 'Flask', level: 0 },
                    { name: 'Pandas', level: 0 },
                    { name: 'NumPy', level: 0 },
                    { name: 'SciPy', level: 0 },
                    { name: 'Matplotlib', level: 0 },
                    { name: 'TensorFlow', level: 0 },
                    { name: 'PyTorch', level: 0 },
                    { name: 'Scikit-learn', level: 0 },
                    { name: 'pytest', level: 0 },
                    { name: 'unittest', level: 0 },
                    { name: 'Jupyter', level: 0 },
                    { name: 'pip', level: 0 },
                    { name: 'Poetry', level: 0 },
                    { name: 'Conda', level: 0 },
                ],
            },
            {
                name: 'Java',
                level: 0,
                subSkills: [
                    { name: 'Spring', level: 0 },
                    { name: 'Spring Boot', level: 0 },
                    { name: 'Hibernate', level: 0 },
                    { name: 'Maven', level: 0 },
                    { name: 'Gradle', level: 0 },
                    { name: 'JUnit', level: 0 },
                    { name: 'TestNG', level: 0 },
                    { name: 'Mockito', level: 0 },
                    { name: 'JavaFX', level: 0 },
                    { name: 'Swing', level: 0 },
                    { name: 'Tomcat', level: 0 },
                    { name: 'JSP/Servlets', level: 0 },
                    { name: 'Groovy', level: 0 },
                ],
            },
            {
                name: 'Kotlin',
                level: 0,
                subSkills: [
                    { name: 'Ktor', level: 0 },
                    { name: 'Coroutines', level: 0 },
                    { name: 'Android Development', level: 0 },
                ],
            },
            {
                name: 'C/C++',
                level: 0,
                subSkills: [
                    { name: 'Qt', level: 0 },
                    { name: 'Boost', level: 0 },
                    { name: 'OpenCV', level: 0 },
                    { name: 'STL', level: 0 },
                    { name: 'CMake', level: 0 },
                    { name: 'Make', level: 0 },
                    { name: 'Conan', level: 0 },
                    { name: 'gcc/g++', level: 0 },
                    { name: 'clang', level: 0 },
                    { name: 'gdb', level: 0 },
                    { name: 'Valgrind', level: 0 },
                ],
            },
            {
                name: 'C#',
                level: 0,
                subSkills: [
                    { name: '.NET', level: 0 },
                    { name: '.NET Core', level: 0 },
                    { name: 'ASP.NET', level: 0 },
                    { name: 'Entity Framework', level: 0 },
                    { name: 'LINQ', level: 0 },
                    { name: 'WPF', level: 0 },
                    { name: 'Unity', level: 0 },
                    { name: 'Blazor', level: 0 },
                ],
            },
            {
                name: 'Go',
                level: 0,
                subSkills: [
                    { name: 'Gin', level: 0 },
                    { name: 'Echo', level: 0 },
                    { name: 'Goroutines', level: 0 },
                    { name: 'gRPC', level: 0 },
                    { name: 'Go Modules', level: 0 },
                ],
            },
            {
                name: 'Rust',
                level: 0,
                subSkills: [
                    { name: 'Cargo', level: 0 },
                    { name: 'Actix', level: 0 },
                    { name: 'Tokio', level: 0 },
                    { name: 'Rocket', level: 0 },
                    { name: 'WebAssembly', level: 0 },
                ],
            },
            { name: 'Ruby', level: 0, subSkills: [{ name: 'Ruby on Rails', level: 0 }] },
            {
                name: 'PHP',
                level: 0,
                subSkills: [
                    { name: 'Laravel', level: 0 },
                    { name: 'Symfony', level: 0 },
                    { name: 'CodeIgniter', level: 0 },
                    { name: 'WordPress', level: 0 },
                    { name: 'Drupal', level: 0 },
                    { name: 'Joomla', level: 0 },
                    { name: 'Composer', level: 0 },
                ],
            },
            {
                name: 'HTML/CSS',
                level: 0,
                subSkills: [
                    { name: 'Sass', level: 0 },
                    { name: 'Less', level: 0 },
                    { name: 'Tailwind CSS', level: 0 },
                    { name: 'Bootstrap', level: 0 },
                    { name: 'Bulma', level: 0 },
                    { name: 'Foundation', level: 0 },
                ],
            },
            { name: 'Swift', level: 0, subSkills: [] },
            {
                name: 'R',
                level: 0,
                subSkills: [
                    { name: 'Shiny', level: 0 },
                    { name: 'ggplot2', level: 0 },
                    { name: 'dplyr', level: 0 },
                    { name: 'tidyr', level: 0 },
                ],
            },
            {
                name: 'MATLAB',
                level: 0,
                subSkills: [{ name: 'Simulink', level: 0 }],
            },
            { name: 'Perl', level: 0, subSkills: [] },
            { name: 'Lua', level: 0 },
            { name: 'Haskell', level: 0 },
            { name: 'Scala', level: 0 },
            { name: 'Elixir', level: 0 },
            { name: 'Clojure', level: 0 },
            {
                name: 'Shell Scripting',
                level: 0,
                subSkills: [
                    { name: 'awk', level: 0 },
                    { name: 'sed', level: 0 },
                    { name: 'grep', level: 0 },
                ],
            },
            { name: 'Erlang', level: 0 },
            {
                name: 'Julia',
                level: 0,
                subSkills: [
                    { name: 'DataFrames.jl', level: 0 },
                    { name: 'Flux.jl', level: 0 },
                    { name: 'Plots.jl', level: 0 },
                    { name: 'JuMP.jl', level: 0 },
                    { name: 'DifferentialEquations.jl', level: 0 },
                ],
            },
            { name: 'Fortran', level: 0 },
            { name: 'COBOL', level: 0 },
            { name: 'Delphi', level: 0, subSkills: [] },
            { name: 'Object Pascal', level: 0, subSkills: [] },
            { name: 'Pascal', level: 0, subSkills: [] },
        ],
    },
    {
        name: 'DevOps',
        skills: [
            { name: 'Ansible', level: 0 },
            { name: 'Nginx', level: 0 },
            {
                name: 'Docker',
                level: 0,
                subSkills: [
                    { name: 'Docker Compose', level: 0 },
                    { name: 'Dockerfile', level: 0 },
                    { name: 'Docker Swarm', level: 0 },
                ],
            },
            {
                name: 'Kubernetes',
                level: 0,
                subSkills: [
                    { name: 'kubectl', level: 0 },
                    { name: 'Helm', level: 0 },
                    { name: 'K9s', level: 0 },
                    { name: 'Ingress', level: 0 },
                ],
            },
            { name: 'Terraform', level: 0 },
            {
                name: 'AWS',
                level: 0,
                subSkills: [
                    { name: 'EC2', level: 0 },
                    { name: 'S3', level: 0 },
                    { name: 'Lambda', level: 0 },
                    { name: 'RDS', level: 0 },
                    { name: 'ECS', level: 0 },
                    { name: 'CloudFormation', level: 0 },
                ],
            },
            {
                name: 'Azure',
                level: 0,
                subSkills: [
                    { name: 'Azure DevOps', level: 0 },
                    { name: 'Azure Functions', level: 0 },
                    { name: 'Azure Blob Storage', level: 0 },
                ],
            },
            {
                name: 'Google Cloud',
                level: 0,
                subSkills: [
                    { name: 'Google Compute Engine', level: 0 },
                    { name: 'Google Cloud Storage', level: 0 },
                    { name: 'Google Kubernetes Engine', level: 0 },
                ],
            },
            { name: 'HashiCorp Vault', level: 0 },
            {
                name: 'CI/CD',
                level: 0,
                subSkills: [
                    { name: 'GitHub Actions', level: 0 },
                    { name: 'GitLab CI', level: 0 },
                    { name: 'CircleCI', level: 0 },
                    { name: 'Jenkins', level: 0 },
                ],
            },
            {
                name: 'Monitoring & Logging',
                level: 0,
                subSkills: [
                    { name: 'Prometheus', level: 0 },
                    { name: 'Grafana', level: 0 },
                    { name: 'ELK Stack', level: 0 },
                    { name: 'OpenTelemetry', level: 0 },
                    { name: 'Jaeger', level: 0 },
                    { name: 'Datadog', level: 0 },
                    { name: 'New Relic', level: 0 },
                ],
            },
        ],
    },
    {
        name: 'Productivity Tools',
        skills: [
            {
                name: 'Git',
                level: 0,
                subSkills: [
                    { name: 'GitHub', level: 0 },
                    { name: 'GitLab', level: 0 },
                    { name: 'Bitbucket', level: 0 },
                ],
            },
            { name: 'SVN', level: 0 },
            { name: 'Jira', level: 0 },
            { name: 'Confluence', level: 0 },
            { name: 'Figma', level: 0 },
            { name: 'Miro', level: 0 },
            { name: 'Notion', level: 0 },
            { name: 'GnuPlot', level: 0 },
            { name: 'Inkscape', level: 0 },
            {
                name: 'Agile Methodologies',
                level: 0,
                subSkills: [
                    { name: 'Pair Programming', level: 0 },
                    { name: 'Test-Driven Development', level: 0 },
                    { name: 'Refactoring', level: 0 },
                    { name: 'Scrum', level: 0 },
                    { name: 'Kanban', level: 0 },
                ],
            },
            {
                name: 'AI Tools',
                level: 0,
                subSkills: [
                    { name: 'Prompt Engineering', level: 0 },
                    { name: 'Chain-of-Thought Prompting', level: 0 },
                    { name: 'LangChain', level: 0 },
                    { name: 'Model Context Protocol', level: 0 },
                    { name: 'Hugging Face', level: 0 },
                    { name: 'GitHub Copilot', level: 0 },
                    { name: 'Cursor', level: 0 },
                    { name: 'Codex', level: 0 },
                ],
            },
            {
                name: 'IDEs',
                level: 0,
                subSkills: [
                    {
                        name: 'VS Code',
                        level: 0,
                    },
                    { name: 'IntelliJ IDEA', level: 0 },
                    { name: 'PyCharm', level: 0 },
                    { name: 'WebStorm', level: 0 },
                    { name: 'Eclipse', level: 0 },
                    { name: 'NetBeans', level: 0 },
                    { name: 'CLion', level: 0 },
                    { name: 'Rider', level: 0 },
                    { name: 'Atom', level: 0 },
                    { name: 'Sublime Text', level: 0 },
                    { name: 'Vim', level: 0 },
                    { name: 'Emacs', level: 0 },
                    { name: 'Visual Studio', level: 0 },
                    { name: 'Xcode', level: 0 },
                    { name: 'Android Studio', level: 0 },
                ],
            },
        ],
    },
    {
        name: 'Databases',
        skills: [
            {
                name: 'PostgreSQL',
                level: 0,
                subSkills: [
                    { name: 'PL/pgSQL', level: 0 },
                    { name: 'PostGIS', level: 0 },
                    { name: 'pg_dump/restore', level: 0 },
                ],
            },
            {
                name: 'MongoDB',
                level: 0,
                subSkills: [
                    { name: 'Mongoose', level: 0 },
                    { name: 'Aggregation', level: 0 },
                    { name: 'Atlas', level: 0 },
                ],
            },
            { name: 'Redis', level: 0 },
            { name: 'SQLite', level: 0 },
            {
                name: 'MySQL',
                level: 0,
                subSkills: [
                    { name: 'MariaDB', level: 0 },
                    { name: 'Stored Procedures', level: 0 },
                ],
            },
            { name: 'Cassandra', level: 0 },
            { name: 'Elasticsearch', level: 0 },
            { name: 'Firebase', level: 0 },
            { name: 'DynamoDB', level: 0 },
            { name: 'Neo4j', level: 0 },
            { name: 'InfluxDB', level: 0 },
            { name: 'CockroachDB', level: 0 },
        ],
    },
];

export function getDefaultSkillsAssessment(mergeWith?: SkillsAssessmentSchema): SkillsAssessmentSchema {
    if (!mergeWith) {
        return defaultSkillsAssessment;
    }
    const merged = defaultSkillsAssessment.map((defaultCategory) => {
        const mergeCategory = mergeWith.find((c) => c.name === defaultCategory.name);
        if (!mergeCategory) {
            return defaultCategory;
        }

        const mergedSkills = [
            ...defaultCategory.skills.map((skill) => {
                const mergeSkill = mergeCategory.skills.find((s) => s.name === skill.name);
                if (!mergeSkill) {
                    return skill;
                }
                const mergedSubSkills = skill.subSkills?.map((subSkill) => {
                    const mergeSubSkill = mergeSkill.subSkills?.find((ss) => ss.name === subSkill.name);
                    return mergeSubSkill ? { ...subSkill, level: mergeSubSkill.level } : subSkill;
                });
                return {
                    ...skill,
                    level: mergeSkill.level,
                    subSkills: mergedSubSkills,
                };
            }),
            ...mergeCategory.skills.filter(
                (mergeSkill) => !defaultCategory.skills.some((skill) => skill.name === mergeSkill.name),
            ),
        ];
        return {
            ...defaultCategory,
            skills: mergedSkills,
        };
    });
    return merged;
}

export function cleanEmptyDefaultSkillsAssessment(data: SkillsAssessmentSchema): SkillsAssessmentSchema {
    return data
        .map((category) => {
            const cleanedSkills = category.skills
                .map((skill) => {
                    if (skill.level > 0) {
                        const cleanedSubSkills = skill.subSkills?.filter((subSkill) => subSkill.level > 0);
                        return {
                            ...skill,
                            subSkills: cleanedSubSkills,
                        };
                    }
                    return null;
                })
                .filter((skill): skill is Exclude<typeof skill, null> => skill !== null);
            if (cleanedSkills.length > 0) {
                return {
                    ...category,
                    skills: cleanedSkills,
                };
            }
            return null;
        })
        .filter((category): category is Exclude<typeof category, null> => category !== null);
}
