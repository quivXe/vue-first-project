<script>
import { ref, computed } from 'vue'

let id = 1; // temp
function tempTaskGenerator(levels, _id=id) {
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  
  }
  let output = []
  for (let i=0; i<levels.length; i++) {
    output.push({
      id: id++,
      name: `task with id ${id-1}`,
      flexIndex: (i+1) * 2,
      status: getRandomInt(0, 2),
      description: "",
      subTasks: tempTaskGenerator(levels[i], _id=id-1),
      parentId: _id
    })
  }
  return output;
}
class TaskManager {
  constructor() {
    this.TASK_STATUSES = {
      TODO: 0,
      DOING: 1,
      DONE: 2
    }

    this.allTasks = ref(tempTaskGenerator([[[[], [], []], []], [[[], []], []], [[]]]))

    this.parentTree = ref([]);

    this.currentTasks = computed(() => {
      return this.getCurrentTasks();
    })

    // Binding all methods to ensure 'this' refers to the correct context
    this.getCurrentTasks = this.getCurrentTasks.bind(this);
    this.findTaskParent = this.findTaskParent.bind(this);
    this.addTask = this.addTask.bind(this);
    this.removeTask = this.removeTask.bind(this);
    this.pushParent = this.pushParent.bind(this);
    this.popParent = this.popParent.bind(this);
    this.selectParentInTree = this.selectParentInTree.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
  }

  getCurrentTasks(index = 0, subTasks = this.allTasks.value) {
    if (this.parentTree.value[index] === undefined) return subTasks;
    let currentTask = subTasks.find(task => task.id === this.parentTree.value[index].id);

    if (!currentTask || !currentTask.subTasks) return null; // Return null if something goes wrong (e.g., task not found)

    return this.getCurrentTasks(index + 1, currentTask.subTasks);
  }

  findTaskParent(subTasks = this.allTasks.value, task) {
    if (subTasks.find(t => t.id === task.id)) return subTasks;

    for (let i=0; i<subTasks.length; i++) {
      let parent = this.findTaskParent(subTasks[i].subTasks, task);
      if (parent !== null) return parent;
    }
    return null;
  }

  addTask(value, parent=null) {
    if ( parent === null ) parent = this.getCurrentTasks();

    let maxFlexIndex = parent.reduce((acc, curr) => {
      if (curr.flexIndex > acc) return curr.flexIndex;
      return acc;
    }, -Infinity);

    parent.push({
      id: id++,
      name: value,
      subTasks: [],
      flexIndex: maxFlexIndex + 2,
      status: 0 // TODO: MAKE STATUS BASED ON COLUMN
    });
  }

  removeTask(task, inCurrentTasks=true) {
    let parent;
    if (inCurrentTasks) parent = this.getCurrentTasks();
    else {
      parent = this.findTaskParent(task);
      if (parent === null) return; // couldnt find given task
    }

    let index = parent.findIndex(t => t.id === task.id);
    if (index !== -1) parent.splice(index, 1);
  }

  changeTaskName(task, newName) {
    task.name = newName;
  }

  updateDescription(task, newDescription) {
    task.description = newDescription;
  }

  pushParent(task) {
    this.parentTree.value.push(task);
  }

  popParent() {
    return this.parentTree.value.pop();
  }

  selectParentInTree(task) {
    while ( this.parentTree.value[this.parentTree.value.length-1].id !== task.id ) {
      this.popParent();
    }
  }

}
export default TaskManager;
</script>