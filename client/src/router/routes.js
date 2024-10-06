import Tasks from '../views/Tasks.vue';          // Your local tasks
import ShareTask from '../views/ShareTask.vue';        // Create collaboration
import SharedTasks from '../views/SharedTasks.vue';  // View shared tasks
import JoinCollaboration from '../views/JoinCollaboration.vue';    // Join a shared task
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
        path: '/tasks/share',
        name: 'ShareTask',
        component: ShareTask,  // Page to create a collaborative task
    },

    // List of tasks user is collaborating on
    {
        path: '/shared',
        name: 'SharedTasks',
        component: SharedTasks,  // List of all collaborations
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

    // Catch-all for Not Found (404)
    {
        path: '/:catchAll(.*)',
        name: 'NotFound',
        component: NotFound,
    }
];

export default routes;
