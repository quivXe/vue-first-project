export function requireTaskId(to, from, next) {
    if (to.params.taskId) {
      next(); // Proceed to the route if taskId is present
    } else {
      next({ name: 'Home' }); // Redirect to Home if taskId is missing
    }
}