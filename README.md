# TODO APP IN VUE
Basic TODO web app.

Using: VUE 3, Node.js, Pusher, SASS


# server API

## COLABORATIONS:
### /api/collaborations/create
**REQUEST**:
- headers: `{ 'Content-Type': 'application/json' }`
- body: `{ name, password }`
**RESPONSE**:
- 201: `{ name: createdCollabName }`
- 400: `{ error: 'A collaboration with this name already exists' }`

### /api/collaborations/join
**REQUEST**:
- headers: `{ 'Content-Type': 'application/json' }`
- body: `{ name, password }`
**RESPONSE**:
- 201: `{ name: collabName }`
- 404: `{ error: 'Collaboration not found or password incorrect.' }`

## OPERATIONS:
### /api/operations/log
**REQUEST**:
headers: `{ 'Content-Type': 'application/json' }`
body: `{ collabId, operationType, details, operationIndex, operation_part, operation_max_part }`
**RESPONSE**:
- 201: `{ collabId,operationType, details, operationIndex, operation_part, operation_max_part }`

### /api/operations/get
**REQUEST**:
headers: ` {'Content-Type': 'application/json' }`
body: `{ collabId, operationIndex }`

**RESPONSE**: 
- 201: Array of operations from given collabId starting from `operationIndex+1`


*All unhandled errors has status code 500*

