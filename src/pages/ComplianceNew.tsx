import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, FileText, Shield, Star, Globe } from 'lucide-react';
import { ComplianceProvider } from '@/contexts/ComplianceContext';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';
import { TaskManagement } from '@/components/compliance/TaskManagement';
import { TaskCalendarView } from '@/components/TaskCalendarView';
import { RequirementsLibrary } from '@/components/RequirementsLibrary';
import ComplianceStrategyDashboard from '@/components/ComplianceStrategyDashboard';
import { ComplianceTaskModal } from '@/components/ComplianceTaskModal';
import { RegulatoryRequirementModal } from '@/components/RegulatoryRequirementModal';
import { TaskTemplates } from '@/components/compliance/TaskTemplates';
import { TaskBulkActions } from '@/components/compliance/TaskBulkActions';
import { AdvancedFilters } from '@/components/compliance/AdvancedFilters';
import { ComplianceAuditTrail } from '@/components/compliance/ComplianceAuditTrail';
import { useCompliance } from '@/contexts/ComplianceContext';

function ComplianceContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { 
    showTaskModal, 
    setShowTaskModal, 
    showRequirementModal, 
    setShowRequirementModal,
    selectedTask,
    criticalTasks,
    overdueTasks,
    upcomingTasks
  } = useCompliance();

  const getTabBadge = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return (criticalTasks.length + overdueTasks.length) > 0 ? (
          <Badge variant="destructive" className="ml-2 text-xs">
            {criticalTasks.length + overdueTasks.length}
          </Badge>
        ) : null;
      case 'tasks':
        return upcomingTasks.length > 0 ? (
          <Badge variant="secondary" className="ml-2 text-xs">
            {upcomingTasks.length}
          </Badge>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-fit">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
            {getTabBadge('dashboard')}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tarefas
            {getTabBadge('tasks')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Ações em Lote
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Matriz Regulatória
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ComplianceDashboard />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid gap-6">
            <AdvancedFilters />
            <TaskManagement />
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TaskTemplates />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <TaskBulkActions />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Calendário de Obrigações</h2>
              <p className="text-sm text-muted-foreground">
                Visualize todas as tarefas de compliance organizadas por prazo
              </p>
            </div>
          </div>
          <TaskCalendarView />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Matriz Regulatória</h2>
              <p className="text-sm text-muted-foreground">
                Base de conhecimento de todas as leis, normas e regulamentos aplicáveis
              </p>
            </div>
          </div>
          <RequirementsLibrary />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Trilha de Auditoria</h2>
              <p className="text-sm text-muted-foreground">
                Histórico completo de todas as ações realizadas no sistema
              </p>
            </div>
          </div>
          <ComplianceAuditTrail />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ComplianceTaskModal 
        open={showTaskModal} 
        onOpenChange={setShowTaskModal}
        task={selectedTask}
      />
      
      <RegulatoryRequirementModal 
        open={showRequirementModal} 
        onOpenChange={setShowRequirementModal}
      />
    </div>
  );
}

export default function ComplianceNew() {
  return (
    <ComplianceProvider>
      <ComplianceContent />
    </ComplianceProvider>
  );
}