import Tasks from '../views/Tasks.vue';          // Your local tasks
import ShareTask from '../views/ShareTask.vue';        // Create collaboration
import CollaborationsList from '../views/CollaborationsList.vue';  // View shared tasks
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
        path: '/collaborations',
        name: 'CollaborationsList',
        component: CollaborationsList,  // List of all collaborations
    },

    // View or edit a specific collaborative task
    {
        path: '/collaborations/:collaborationName',
        name: 'TaskCollaboration',
        component: Tasks,   // Collaborative task detail page
        props: { collaborative: true },   // Pass taskId as a prop
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
