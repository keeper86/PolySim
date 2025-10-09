import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';

const defaultSkillsAssessment: SkillsAssessmentSchema = [
    {
        category: 'Programming Languages',
        skills: [
            {
                name: 'JavaScript',
                subSkills: [
                    { name: 'TypeScript' },
                    { name: 'Node.js' },
                    { name: 'Deno' },
                    { name: 'Bun' },
                    { name: 'Express.js' },
                    { name: 'React' },
                    { name: 'Next.js' },
                    { name: 'Remix' },
                    { name: 'Vue.js' },
                    { name: 'Nuxt.js' },
                    { name: 'Svelte' },
                    { name: 'SvelteKit' },
                    { name: 'Solid.js' },
                    { name: 'Astro' },
                    { name: 'Angular' },
                    { name: 'Playwright' },
                    { name: 'Cypress' },
                    { name: 'Vitest' },
                    { name: 'Jest' },
                    { name: 'Mocha' },
                    { name: 'Vite' },
                    { name: 'esbuild' },
                    { name: 'SWC' },
                    { name: 'Webpack' },
                    { name: 'Rollup' },
                    { name: 'ESLint' },
                    { name: 'Prettier' },
                    { name: 'Redux' },
                    { name: 'MobX' },
                    { name: 'pnpm' },
                    { name: 'yarn' },
                    { name: 'npm' },
                    { name: 'D3.js' },
                    { name: 'Chart.js' },
                    { name: 'Three.js' },
                ],
            },
            {
                name: 'Python',
                subSkills: [
                    { name: 'Django' },
                    { name: 'FastAPI' },
                    { name: 'Flask' },
                    { name: 'Pandas' },
                    { name: 'NumPy' },
                    { name: 'SciPy' },
                    { name: 'Matplotlib' },
                    { name: 'TensorFlow' },
                    { name: 'PyTorch' },
                    { name: 'Scikit-learn' },
                    { name: 'pytest' },
                    { name: 'unittest' },
                    { name: 'Jupyter' },
                    { name: 'pip' },
                    { name: 'Poetry' },
                    { name: 'Conda' },
                ],
            },
            {
                name: 'Java',
                subSkills: [
                    { name: 'Spring' },
                    { name: 'Spring Boot' },
                    { name: 'Hibernate' },
                    { name: 'Maven' },
                    { name: 'Gradle' },
                    { name: 'JUnit' },
                    { name: 'TestNG' },
                    { name: 'Mockito' },
                    { name: 'JavaFX' },
                    { name: 'Swing' },
                    { name: 'Tomcat' },
                    { name: 'JSP/Servlets' },
                    { name: 'Groovy' },
                ],
            },
            {
                name: 'Kotlin',
                subSkills: [{ name: 'Ktor' }, { name: 'Coroutines' }, { name: 'Android Development' }],
            },
            {
                name: 'C/C++',
                subSkills: [
                    { name: 'Qt' },
                    { name: 'Boost' },
                    { name: 'OpenCV' },
                    { name: 'STL' },
                    { name: 'CMake' },
                    { name: 'Make' },
                    { name: 'Conan' },
                    { name: 'gcc/g++' },
                    { name: 'clang' },
                    { name: 'gdb' },
                    { name: 'Valgrind' },
                ],
            },
            {
                name: 'C#',
                subSkills: [
                    { name: '.NET' },
                    { name: '.NET Core' },
                    { name: 'ASP.NET' },
                    { name: 'Entity Framework' },
                    { name: 'LINQ' },
                    { name: 'WPF' },
                    { name: 'Unity' },
                    { name: 'Blazor' },
                ],
            },
            {
                name: 'Go',
                subSkills: [
                    { name: 'Gin' },
                    { name: 'Echo' },
                    { name: 'Goroutines' },
                    { name: 'gRPC' },
                    { name: 'Go Modules' },
                ],
            },
            {
                name: 'Rust',
                subSkills: [
                    { name: 'Cargo' },
                    { name: 'Actix' },
                    { name: 'Tokio' },
                    { name: 'Rocket' },
                    { name: 'WebAssembly' },
                ],
            },
            { name: 'Ruby', subSkills: [{ name: 'Ruby on Rails' }] },
            {
                name: 'PHP',
                subSkills: [
                    { name: 'Laravel' },
                    { name: 'Symfony' },
                    { name: 'CodeIgniter' },
                    { name: 'WordPress' },
                    { name: 'Drupal' },
                    { name: 'Joomla' },
                    { name: 'Composer' },
                ],
            },
            {
                name: 'HTML/CSS',
                subSkills: [
                    { name: 'Sass' },
                    { name: 'Less' },
                    { name: 'Tailwind CSS' },
                    { name: 'Bootstrap' },
                    { name: 'Bulma' },
                    { name: 'Foundation' },
                ],
            },
            { name: 'Swift', subSkills: [] },
            {
                name: 'R',
                subSkills: [{ name: 'Shiny' }, { name: 'ggplot2' }, { name: 'dplyr' }, { name: 'tidyr' }],
            },
            {
                name: 'MATLAB',
                subSkills: [{ name: 'Simulink' }],
            },
            { name: 'Perl', subSkills: [] },
            { name: 'Lua' },
            { name: 'Haskell' },
            { name: 'Scala' },
            { name: 'Elixir' },
            { name: 'Clojure' },
            {
                name: 'Shell Scripting',
                subSkills: [{ name: 'awk' }, { name: 'sed' }, { name: 'grep' }],
            },
            { name: 'Erlang' },
            {
                name: 'Julia',
                subSkills: [
                    { name: 'DataFrames.jl' },
                    { name: 'Flux.jl' },
                    { name: 'Plots.jl' },
                    { name: 'JuMP.jl' },
                    { name: 'DifferentialEquations.jl' },
                ],
            },
            { name: 'Fortran' },
            { name: 'Pascal/Delphi', subSkills: [] },
        ],
    },
    {
        category: 'DevOps',
        skills: [
            { name: 'Ansible' },
            { name: 'Nginx' },
            {
                name: 'Docker',
                subSkills: [{ name: 'Docker Compose' }, { name: 'Dockerfile' }, { name: 'Docker Swarm' }],
            },
            {
                name: 'Kubernetes',
                subSkills: [{ name: 'kubectl' }, { name: 'Helm' }, { name: 'K9s' }, { name: 'Ingress' }],
            },
            { name: 'Terraform' },
            {
                name: 'AWS',
                subSkills: [
                    { name: 'EC2' },
                    { name: 'S3' },
                    { name: 'Lambda' },
                    { name: 'RDS' },
                    { name: 'ECS' },
                    { name: 'CloudFormation' },
                ],
            },
            {
                name: 'Azure',
                subSkills: [{ name: 'Azure DevOps' }, { name: 'Azure Functions' }, { name: 'Azure Blob Storage' }],
            },
            {
                name: 'Google Cloud',
                subSkills: [
                    { name: 'Google Compute Engine' },
                    { name: 'Google Cloud Storage' },
                    { name: 'Google Kubernetes Engine' },
                ],
            },
            { name: 'HashiCorp Vault' },
            {
                name: 'CI/CD',
                subSkills: [
                    { name: 'GitHub Actions' },
                    { name: 'GitLab CI' },
                    { name: 'CircleCI' },
                    { name: 'Jenkins' },
                ],
            },
            {
                name: 'Monitoring & Logging',
                subSkills: [
                    { name: 'Prometheus' },
                    { name: 'Grafana' },
                    { name: 'ELK Stack' },
                    { name: 'OpenTelemetry' },
                    { name: 'Jaeger' },
                    { name: 'Datadog' },
                    { name: 'New Relic' },
                ],
            },
        ],
    },
    {
        category: 'Productivity Tools',
        skills: [
            {
                name: 'Git',
                subSkills: [{ name: 'GitHub' }, { name: 'GitLab' }, { name: 'Bitbucket' }],
            },
            { name: 'SVN' },
            { name: 'Jira' },
            { name: 'Confluence' },
            { name: 'Figma' },
            { name: 'Miro' },
            { name: 'Notion' },
            { name: 'GnuPlot' },
            { name: 'Inkscape' },
            {
                name: 'Agile Methodologies',
                subSkills: [
                    { name: 'Pair Programming' },
                    { name: 'Test-Driven Development' },
                    { name: 'Refactoring' },
                    { name: 'Scrum' },
                    { name: 'Kanban' },
                ],
            },
            {
                name: 'AI Tools',
                subSkills: [
                    { name: 'Prompt Engineering' },
                    { name: 'Chain-of-Thought Prompting' },
                    { name: 'LangChain' },
                    { name: 'Model Context Protocol' },
                    { name: 'Hugging Face' },
                    { name: 'GitHub Copilot' },
                    { name: 'Cursor' },
                    { name: 'Codex' },
                ],
            },
            {
                name: 'IDEs',
                subSkills: [
                    { name: 'VS Code' },
                    { name: 'IntelliJ IDEA' },
                    { name: 'PyCharm' },
                    { name: 'WebStorm' },
                    { name: 'Eclipse' },
                    { name: 'NetBeans' },
                    { name: 'CLion' },
                    { name: 'Rider' },
                    { name: 'Atom' },
                    { name: 'Sublime Text' },
                    { name: 'Vim' },
                    { name: 'Emacs' },
                    { name: 'Visual Studio' },
                    { name: 'Xcode' },
                    { name: 'Android Studio' },
                ],
            },
        ],
    },
    {
        category: 'Databases',
        skills: [
            {
                name: 'PostgreSQL',
                subSkills: [{ name: 'PL/pgSQL' }, { name: 'PostGIS' }, { name: 'pg_dump/restore' }],
            },
            {
                name: 'MongoDB',
                subSkills: [{ name: 'Mongoose' }, { name: 'Aggregation' }, { name: 'Atlas' }],
            },
            { name: 'Redis' },
            { name: 'SQLite' },
            {
                name: 'MySQL',
                subSkills: [{ name: 'MariaDB' }, { name: 'Stored Procedures' }],
            },
            { name: 'Cassandra' },
            { name: 'Elasticsearch' },
            { name: 'Firebase' },
            { name: 'DynamoDB' },
            { name: 'Neo4j' },
            { name: 'InfluxDB' },
            { name: 'CockroachDB' },
        ],
    },
];

export const isDefaultSkill = (skillName: string) => {
    for (const category of defaultSkillsAssessment) {
        for (const skill of category.skills) {
            if (skill.name.toLowerCase() === skillName.toLowerCase()) {
                return true;
            }
            if (skill.subSkills) {
                for (const subSkill of skill.subSkills) {
                    if (subSkill.name.toLowerCase() === skillName.toLowerCase()) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};

export function getDefaultSkillsAssessment(mergeWith?: SkillsAssessmentSchema): SkillsAssessmentSchema {
    if (!mergeWith) {
        return defaultSkillsAssessment;
    }
    const merged = defaultSkillsAssessment.map((defaultCategory) => {
        const mergeCategory = mergeWith.find((c) => c.category === defaultCategory.category);
        if (!mergeCategory) {
            return defaultCategory;
        }

        const mergedSkills = [
            ...defaultCategory.skills.map((skill) => {
                const mergeSkill = mergeCategory.skills.find((s) => s.name === skill.name);
                if (!mergeSkill) {
                    return skill;
                }

                const defaultSubSkills = skill.subSkills || [];
                const mergeSubSkills = mergeSkill.subSkills || [];

                const defaultSubSkillsMap = new Map(defaultSubSkills.map((ss) => [ss.name, ss]));
                const mergeSubSkillsMap = new Map(mergeSubSkills.map((ss) => [ss.name, ss]));

                const mergedSubSkills = [
                    ...defaultSubSkills.map((subSkill) => {
                        const mergeSubSkill = mergeSubSkillsMap.get(subSkill.name);
                        return mergeSubSkill ? { ...subSkill, level: mergeSubSkill.level } : subSkill;
                    }),
                    ...mergeSubSkills.filter((ss) => !defaultSubSkillsMap.has(ss.name)),
                ];

                return {
                    ...skill,
                    level: mergeSkill.level,
                    subSkills: mergedSubSkills.length > 0 ? mergedSubSkills : undefined,
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
                    if (!isDefaultSkill(skill.name)) {
                        console.log(`Keeping user-defined skill: ${skill.name}`);

                        return skill;
                    }
                    if (skill.level && skill.level > 0) {
                        let cleanedSubSkills = skill.subSkills;
                        if (Array.isArray(skill.subSkills)) {
                            cleanedSubSkills = skill.subSkills.filter((subSkill) => {
                                if (!isDefaultSkill(subSkill.name)) {
                                    return true;
                                }
                                return subSkill.level && subSkill.level > 0;
                            });
                        }
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
