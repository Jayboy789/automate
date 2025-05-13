import ScriptNode from './ScriptNode';
import ConditionNode from './ConditionNode';
import WaitNode from './WaitNode';
import VariableNode from './VariableNode';
import HttpNode from './HttpNode';
import WebhookNode from './WebhookNode';
import ScheduleNode from './ScheduleNode';
import LoopNode from './LoopNode';
import TransformNode from './TransformNode';

// Node types map for React Flow
const nodeTypes = {
  scriptNode: ScriptNode,
  conditionNode: ConditionNode,
  waitNode: WaitNode,
  variableNode: VariableNode,
  httpNode: HttpNode,
  webhookNode: WebhookNode,
  scheduleNode: ScheduleNode,
  loopNode: LoopNode,
  transformNode: TransformNode
};

export default nodeTypes;