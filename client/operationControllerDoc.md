## Functions

<dl>
<dt><a href="#logOperation">logOperation(req, res)</a></dt>
<dd><p>Log a new operation.</p>
<p>This function creates a new operation entry in the database for a specified collaboration.
It requires collaboration ID, operation type, details, and other operation-related data.</p>
<p>Handled response status codes:</p>
<p>201 - Request successful, sends created operation.</p>
<p>500 - Internal error occured.</p>
</dd>
<dt><a href="#getOperationsForCollab">getOperationsForCollab(req, res)</a></dt>
<dd><p>Get operations for a collaboration with operationIndex filter.</p>
<p>This function retrieves all operations associated with a specified collaboration ID.
Optionally, it can filter operations based on the provided operation index.</p>
<p>Handled response status codes:</p>
<p>200 - Sends Array of operations for specified collaboration.</p>
<p>500 - Internal error occured.</p>
</dd>
</dl>

<a name="logOperation"></a>

## logOperation(req, res)
Log a new operation.

This function creates a new operation entry in the database for a specified collaboration.
It requires collaboration ID, operation type, details, and other operation-related data.

Handled response status codes:

201 - Request successful, sends created operation.

500 - Internal error occured.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | The request object containing the operation data. |
| req.body | <code>Object</code> | The request body containing operation details. |
| req.body.collabId | <code>number</code> | The ID of the collaboration. |
| req.body.operationType | <code>string</code> | The type of the operation ('create'|'update'|'delete'). |
| req.body.details | <code>string</code> | Additional details about the operation. |
| req.body.operationIndex | <code>number</code> | The index of the operation in the sequence. |
| req.body.operation_part | <code>number</code> | The part number of the operation. |
| req.body.operation_max_part | <code>number</code> | The maximum part number of the operation. |
| res | <code>Object</code> | The response object used to send responses to the client. |

**Example**  
```js
// Example of logging a new operation
POST /operations/log
{
  "collabId": 1,
  "operationType": "create",
  "details": "Created a new task",
  "operationIndex": 1,
  "operation_part": 1,
  "operation_max_part": 3
}
```
<a name="getOperationsForCollab"></a>

## getOperationsForCollab(req, res)
Get operations for a collaboration with operationIndex filter.

This function retrieves all operations associated with a specified collaboration ID.
Optionally, it can filter operations based on the provided operation index.

Handled response status codes:

200 - Sends Array of operations for specified collaboration.

500 - Internal error occured.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | The request object containing the filter criteria. |
| req.body | <code>Object</code> | The request body containing filter criteria. |
| req.body.collabId | <code>number</code> | The ID of the collaboration. |
| [req.body.operationIndex] | <code>number</code> | Optional operation index to filter results (greater than this value). |
| res | <code>Object</code> | The response object used to send responses to the client. |

