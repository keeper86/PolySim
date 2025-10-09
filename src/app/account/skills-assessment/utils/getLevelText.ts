export function getLevelText(level: number) {
    switch (level) {
        case 0:
            return {
                label: 'No experience',
                description: 'What?',
            };
        case 1:
            return {
                label: 'Beginner',
                description: 'Some Experience, basic understanding, can work with guidance and documentation',
            };
        case 2:
            return {
                label: 'Intermediate',
                description: 'Solid working knowledge, can solve problems independently',
            };
        case 3:
            return {
                label: 'Expert',
                description: 'Can mentor others and handle complex challenges, knows their limitations',
            };
        default:
            return {
                label: `${level}`,
                description: 'Unknown level',
            };
    }
}
