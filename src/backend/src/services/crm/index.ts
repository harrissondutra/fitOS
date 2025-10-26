/**
 * CRM Services Index - FitOS Sprint 4
 * 
 * Exporta todos os services do módulo CRM para facilitar importação.
 */

// Core CRM Services
export { CRMPipelineService } from './crm-pipeline.service';
export { DealService } from './deal.service';
export { AutomationWorkflowService } from './automation-workflow.service';

// Service Instances (singletons)
export { crmPipelineService } from './crm-pipeline.service';
export { dealService } from './deal.service';
export { automationWorkflowService } from './automation-workflow.service';

// Types
export type {
  CRMPipelineCreateInput,
  CRMPipelineUpdateInput,
  CRMPipelineFilters,
  PipelineStats
} from './crm-pipeline.service';

export type {
  DealCreateInput,
  DealUpdateInput,
  DealFilters,
  DealStats
} from './deal.service';

export type {
  AutomationWorkflowCreateInput,
  AutomationWorkflowUpdateInput,
  AutomationWorkflowFilters,
  WorkflowExecutionResult,
  WorkflowStats
} from './automation-workflow.service';
