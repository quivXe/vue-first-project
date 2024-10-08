# TODO APP IN VUE

Basic TODO web app.

Using: VUE 3, Node.js, Pusher, SASS

# server API

## COLLABORATIONS

### /api/collaborations/create

#### REQUEST

- headers: `{ 'Content-Type': 'application/json' }`
- body: `{ name, password }`

#### RESPONSE

- 201: `{ name: createdCollabName }`
- 400: `{ error: 'A collaboration with this name already exists' }`
- 422:
  - `{ error: 'Invalid characters in name. Only letters, numbers, and _ - = @ , . ; are allowed' }`
  - `{ error: 'Name length cannot be longer than 156' }`

### /api/collaborations/join

#### REQUEST

- headers: `{ 'Content-Type': 'application/json' }`
- body: `{ name, password }`

#### RESPONSE

- 201: `{ name: collabName }`
- 400: `{ error: 'Collaboration not found or password incorrect' }`

## OPERATIONS

### /api/operations/log

#### REQUEST

headers: `{ 'Content-Type': 'application/json' }`
body: `{ collabId, operationType, details, operationIndex, operation_part, operation_max_part }`

#### RESPONSE

- 200: `{ collabId,operationType, details, operationIndex, operation_part, operation_max_part }`

### /api/operations/get

#### REQUEST

headers: `{'Content-Type': 'application/json' }`
body: `{ collabId, operationIndex }`

#### RESPONSE

- 201: Array of operations from given collabId starting from `operationIndex+1`

*All unhandled errors has status code 5xx*

```
todo-app-vue
├─ .git
│  ├─ COMMIT_EDITMSG
│  ├─ config
│  ├─ description
│  ├─ gitk.cache
│  ├─ HEAD
│  ├─ hooks
│  │  ├─ applypatch-msg.sample
│  │  ├─ commit-msg.sample
│  │  ├─ fsmonitor-watchman.sample
│  │  ├─ post-update.sample
│  │  ├─ pre-applypatch.sample
│  │  ├─ pre-commit.sample
│  │  ├─ pre-merge-commit.sample
│  │  ├─ pre-push.sample
│  │  ├─ pre-rebase.sample
│  │  ├─ pre-receive.sample
│  │  ├─ prepare-commit-msg.sample
│  │  ├─ push-to-checkout.sample
│  │  └─ update.sample
│  ├─ index
│  ├─ info
│  │  ├─ exclude
│  │  └─ refs
│  ├─ objects
│  │  ├─ info
│  │  │  └─ packs
│  │  └─ pack
│  │     ├─ pack-a4dd9643eaf3dcb46be0bb8b8b1c679f55b8f506.idx
│  │     └─ pack-a4dd9643eaf3dcb46be0bb8b8b1c679f55b8f506.pack
│  ├─ ORIG_HEAD
│  ├─ packed-refs
│  └─ refs
│     ├─ heads
│     │  └─ main
│     ├─ remotes
│     │  └─ origin
│     │     └─ main
│     └─ tags
├─ .gitignore
├─ client
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ favicon.ico
│  ├─ src
│  │  ├─ App.vue
│  │  ├─ assets
│  │  │  ├─ images
│  │  │  │  ├─ edit.svg
│  │  │  │  ├─ join1.svg
│  │  │  │  ├─ join2.svg
│  │  │  │  ├─ local_tasks.svg
│  │  │  │  ├─ logo.svg
│  │  │  │  ├─ more.svg
│  │  │  │  ├─ shared_tasks.svg
│  │  │  │  └─ show.svg
│  │  │  ├─ javascript
│  │  │  └─ styles
│  │  │     ├─ main.css
│  │  │     └─ _common.sass
│  │  ├─ components
│  │  │  └─ todoTasks
│  │  │     ├─ AddTaskButton.vue
│  │  │     ├─ Column.vue
│  │  │     ├─ description
│  │  │     │  ├─ Description.vue
│  │  │     │  └─ ShowDescriptionButton.vue
│  │  │     ├─ index.js
│  │  │     ├─ nav
│  │  │     │  ├─ BackButton.vue
│  │  │     │  └─ ParentTree.vue
│  │  │     ├─ Options.vue
│  │  │     └─ Task.vue
│  │  ├─ main.js
│  │  ├─ router
│  │  │  ├─ guards.js
│  │  │  ├─ index.js
│  │  │  └─ routes.js
│  │  ├─ services
│  │  │  ├─ IndexedDBManager.js
│  │  │  ├─ TaskManager.js
│  │  │  └─ UIManager.js
│  │  ├─ store
│  │  └─ views
│  │     ├─ Collaborations.vue
│  │     ├─ JoinCollaboration.vue
│  │     ├─ NotFound.vue
│  │     ├─ ShareTask.vue
│  │     └─ Tasks.vue
│  └─ vite.config.js
├─ package-lock.json
├─ README.md
└─ server
   ├─ app.js
   ├─ config
   │  └─ db.js
   ├─ controllers
   │  ├─ collaborationController.js
   │  └─ operationController.js
   ├─ middlewares
   │  └─ rateLimiter.js
   ├─ models
   │  ├─ Collaboration.js
   │  ├─ index.js
   │  └─ Operation.js
   ├─ package-lock.json
   ├─ package.json
   ├─ routes
   │  ├─ collaborationRoutes.js
   │  └─ operationRoutes.js
   ├─ server.js
   ├─ services
   └─ utils
      └─ hashUtils.js

```
