import { getActivities } from './controller/activities';
import { getProvGraph } from './controller/ageGraph';
import { health } from './controller/health';
import { logs } from './controller/logs';
import { createPAT, deletePAT, listPATs, revokePAT } from './controller/pAccessToken';
import { getCommonAncestors, getEntityDescendants, getEntityLineage } from './controller/provenance';
import { createProject } from './controller/projects';
import { getSkillsAssessment, updateSkillsAssessment } from './controller/skillsAssessment';
import { activityUpload } from './controller/uploadActivity';
import { getUser, getUserIdFromSession as getUserIdFromPAT, getUsers, updateUser } from './controller/user';
import { trpcRoot } from './trpcRoot';

const protectedAppRouter = trpcRoot.router({
    createProject: createProject(),
    getSkillsAssessment: getSkillsAssessment(),
    updateSkillsAssessment: updateSkillsAssessment(),
    getUsers: getUsers(),
    getUser: getUser(),
    updateUser: updateUser(),
    createPAT: createPAT(),
    listPATs: listPATs(),
    revokePAT: revokePAT(),
    deletePAT: deletePAT(),
    getActivities: getActivities(),
});

export const publicAccessibleRouter = trpcRoot.router({
    logs: logs(),
    health: health(),
    getProvGraph: getProvGraph(),
    getUserIdFromPAT: getUserIdFromPAT(),
    uploadActivity: activityUpload(),
    getEntityLineage: getEntityLineage(),
    getEntityDescendants: getEntityDescendants(),
    getCommonAncestors: getCommonAncestors(),
});

export const appRouter = trpcRoot.mergeRouters(publicAccessibleRouter, protectedAppRouter);
export type AppRouter = typeof appRouter;
