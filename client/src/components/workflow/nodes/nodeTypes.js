// client/src/components/workflow/nodes/nodeTypes.js
import ScriptNode from './ScriptNode';
import ConditionNode from './ConditionNode';
import WaitNode from './WaitNode';
import VariableNode from './VariableNode';
import HttpNode from './HttpNode';
import WebhookNode from './WebhookNode';
import ScheduleNode from './ScheduleNode';
import LoopNode from './LoopNode';
import TransformNode from './TransformNode';
import ForeachNode from './ForeachNode';
import StringNode from './StringNode';

// Additional nodes
/*
import EmailNode from './EmailNode';
import SwitchNode from './SwitchNode';
import ParallelNode from './ParallelNode';
import ArrayNode from './ArrayNode';
import ObjectNode from './ObjectNode';
import MathNode from './MathNode';
import DateNode from './DateNode';
import EventNode from './EventNode';
import ApiNode from './ApiNode';
import NotificationNode from './NotificationNode';
import DatabaseNode from './DatabaseNode';
import FileNode from './FileNode';
import EmailTriggerNode from './EmailTriggerNode';
import FormSubmitNode from './FormSubmitNode';
import SlackNode from './SlackNode';
import TeamsNode from './TeamsNode';
import SharePointNode from './SharePointNode';
import GoogleDriveNode from './GoogleDriveNode';
import SalesforceNode from './SalesforceNode';
import JiraNode from './JiraNode';
import ZendeskNode from './ZendeskNode';
import ScopeNode from './ScopeNode';
*/
// Node types map for React Flow
const nodeTypes = {
  // Basic nodes
  scriptNode: ScriptNode,
  conditionNode: ConditionNode,
  waitNode: WaitNode,
  variableNode: VariableNode,
  httpNode: HttpNode,
  webhookNode: WebhookNode,
  scheduleNode: ScheduleNode,
  loopNode: LoopNode,
  transformNode: TransformNode,
  
  // Our new nodes
  foreachNode: ForeachNode,
  stringNode: StringNode,
  
  /* Additional nodes (stub implementations)
  emailNode: ScriptNode, // Using scriptNode as placeholder for now
  switchNode: ConditionNode, // Using conditionNode as placeholder for now
  parallelNode: ScriptNode, // Using scriptNode as placeholder for now
  arrayNode: VariableNode, // Using variableNode as placeholder for now
  objectNode: VariableNode, // Using variableNode as placeholder for now
  mathNode: ScriptNode, // Using scriptNode as placeholder for now
  dateNode: ScriptNode, // Using scriptNode as placeholder for now
  eventNode: WebhookNode, // Using webhookNode as placeholder for now
  apiNode: HttpNode, // Using httpNode as placeholder for now
  notificationNode: ScriptNode, // Using scriptNode as placeholder for now
  databaseNode: ScriptNode, // Using scriptNode as placeholder for now
  fileNode: ScriptNode, // Using scriptNode as placeholder for now
  emailTriggerNode: WebhookNode, // Using webhookNode as placeholder for now
  formSubmitNode: WebhookNode, // Using webhookNode as placeholder for now
  slackNode: HttpNode, // Using httpNode as placeholder for now
  teamsNode: HttpNode, // Using httpNode as placeholder for now
  sharepointNode: HttpNode, // Using httpNode as placeholder for now
  googleDriveNode: HttpNode, // Using httpNode as placeholder for now
  salesforceNode: HttpNode, // Using httpNode as placeholder for now
  jiraNode: HttpNode, // Using httpNode as placeholder for now
  zendeskNode: HttpNode, // Using httpNode as placeholder for now
  scopeNode: LoopNode // Using loopNode as placeholder for now
  */
  };

export default nodeTypes;