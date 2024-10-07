import Tasks from '../views/Tasks.vue';          // Your local tasks
import ShareTask from '../views/ShareTask.vue';        // Create collaboration
import Collaborations from '../views/Collaborations.vue';  // View saved collaborations
import JoinCollaboration from '../views/JoinCollaboration.vue';    // Join new collaboration
import NotFound from '../views/NotFound.vue';          // 404 Not Found

const routes = [
    // Your local tasks (Main page)
    {
        path: '/',
        name: 'LocalTasks',
        component: Tasks,  // Local tasks list
        props: { collaborative: false }
    },
    
    // Create a collaboration (share task with others)
    {
        path: '/share/:taskId',
        name: 'ShareTask',
        component: ShareTask,  // Page to create a collaborative task
    },

    // List of tasks user is collaborating on
    {
        path: '/collaborations',
        name: 'Collaborations',
        component: Collaborations,  // List of all collaborations
    },

    // Join collaboration
    {
        path: '/collaborations/:collaborationName',
        name: 'TaskCollaboration',
        component: Tasks,
        props: { collaborative: true },
    },

    // Join a collaboration using credentials (invitation link)
    {
        path: '/join',
        name: 'JoinCollaboration',
        component: JoinCollaboration,   // Join collaboration by entering credentials or link
    },
    {
        path: '/join/:collaborationName',
        name: 'JoinCollaborationWithName',
        component: JoinCollaboration
    },

    // Catch-all for Not Found (404)
    {
        path: '/:catchAll(.*)',
        name: 'NotFound',
        component: NotFound,
    }
];

export default routes;
