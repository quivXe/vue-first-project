import { v4 as uuidv4 } from 'uuid';


export function generateUUID() {
  return `${Date.now()}-${uuidv4()}`;
}
