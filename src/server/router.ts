import { activityUpload } from './controller/uploadActivity';
import { getActivities } from './controller/activities';
import { health } from './controller/health';
import { logs } from './controller/logs';
import { createPAT, listPATs, revokePAT, deletePAT } from './controller/pAccessToken';
import { createProject } from './controller/projects';
import { getSkillsAssessment, updateSkillsAssessment } from './controller/skillsAssessment';
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
    getUserIdFromPAT: getUserIdFromPAT(),
    uploadActivity: activityUpload(),
});

export const appRouter = trpcRoot.mergeRouters(publicAccessibleRouter, protectedAppRouter);
export type AppRouter = typeof appRouter;
