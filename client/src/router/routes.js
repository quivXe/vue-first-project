import TodoList from '../views/TodoList.vue'
import NotFound from '../views/NotFound.vue'
import { requireTaskId } from './guards';

const routes = [
    {
        path: '/',
        name: 'TodoList',
        component: TodoList,
    },
    {
        path: '/upload/:taskId',
        name: 'UploadTask',
        component: null,
        beforeEnter: requireTaskId
    },
    {
        path: '/:catchAll(.*)',
        name: 'NotFound',
        component: NotFound
    }
];

export default routes;