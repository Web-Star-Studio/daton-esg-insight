import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  Settings,
  BarChart3,
  Edit,
  UserPlus
} from "lucide-react";
import { getBoardMembers, getCorporatePolicies, getWhistleblowerReports, getGovernanceMetrics } from "@/services/governance";
import { getESGRisks, getRiskMetrics } from "@/services/esgRisks";
import { getEmployees, getEmployeesStats } from "@/services/employees";
import { BoardMemberModal } from "@/components/BoardMemberModal";
import { CorporatePolicyModal } from "@/components/CorporatePolicyModal";
import { WhistleblowerModal } from "@/components/WhistleblowerModal";
import { GovernanceReportsModal } from "@/components/GovernanceReportsModal";
import { EmployeeModal } from "@/components/EmployeeModal";
import { GovernanceDashboard } from "@/components/GovernanceDashboard";
import { UnifiedDashboardWidget } from "@/components/UnifiedDashboardWidget";
import { LazyIntelligenceHub, LazySystemPerformanceMonitor } from "@/components/optimized/LazyGovernanceComponents";
import { GovernanceStructure } from "@/components/GovernanceStructure";
import { CorporatePolicies } from "@/components/CorporatePolicies";
import { EmployeesList } from "@/components/EmployeesList";
import { ESGRisksMatrix } from "@/components/ESGRisksMatrix";
import { EthicsChannel } from "@/components/EthicsChannel";
import { LoadingState } from "@/components/ui/loading-state";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "@/hooks/use-toast";

export default function GovernancaESG() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isWhistleblowerModalOpen, setIsWhistleblowerModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  // Optimized queries with caching and error handling
  const { data: governanceMetrics, isLoading: loadingGovernance, error: governanceError } = useOptimizedQuery({
    queryKey: ['governance-metrics'],
    queryFn: getGovernanceMetrics,
    staleTime: 5 * 60 * 1000,
  });

  const { data: employees, refetch: refetchEmployees, isLoading: loadingEmployees } = useOptimizedQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const { data: employeeStats, isLoading: loadingEmployeeStats } = useOptimizedQuery({
    queryKey: ['employee-stats'],
    queryFn: getEmployeesStats,
  });

  const { data: riskMetrics, isLoading: loadingRisks } = useOptimizedQuery({
    queryKey: ['risk-metrics'],
    queryFn: getRiskMetrics,
  });

  const { data: boardMembers, isLoading: loadingBoard } = useOptimizedQuery({
    queryKey: ['board-members'],
    queryFn: getBoardMembers,
  });

  const { data: policies, isLoading: loadingPolicies } = useOptimizedQuery({
    queryKey: ['corporate-policies'],
    queryFn: getCorporatePolicies,
  });

  const { data: reports, isLoading: loadingReports } = useOptimizedQuery({
    queryKey: ['whistleblower-reports'],
    queryFn: getWhistleblowerReports,
  });

  const { data: risks, isLoading: loadingESGRisks } = useOptimizedQuery({
    queryKey: ['esg-risks'],
    queryFn: getESGRisks,
  });

  // Event handlers
  const refetchData = () => {
    toast({
      title: "Dados Atualizados",
      description: "As informações de governança foram atualizadas com sucesso.",
    });
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setModalMode('edit');
    setIsBoardModalOpen(true);
  };

  const handleEditPolicy = (policy: any) => {
    setSelectedPolicy(policy);
    setModalMode('edit');
    setIsPolicyModalOpen(true);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setModalMode('view');
    setIsWhistleblowerModalOpen(true);
  };

  const handleInvestigateReport = (report: any) => {
    setSelectedReport(report);
    setModalMode('investigate');
    setIsWhistleblowerModalOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setIsEmployeeModalOpen(true);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">ESG Governança</h1>
              <p className="text-muted-foreground">
                Gestão completa dos aspectos de governança corporativa
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsReportsModalOpen(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedMember(null);
                  setModalMode('create');
                  setIsBoardModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="structure">Estrutura</TabsTrigger>
              <TabsTrigger value="policies">Políticas</TabsTrigger>
              <TabsTrigger value="employees">Funcionários</TabsTrigger>
              <TabsTrigger value="risks">Riscos ESG</TabsTrigger>
              <TabsTrigger value="ethics">Ética</TabsTrigger>
              <TabsTrigger value="intelligence">Central IA</TabsTrigger>
              <TabsTrigger value="system">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <LoadingState 
                loading={loadingGovernance || loadingRisks} 
                error={governanceError}
                skeleton={<DashboardSkeleton />}
              >
                <div className="grid gap-6 animate-fade-in">
                  <GovernanceDashboard governanceMetrics={governanceMetrics} riskMetrics={riskMetrics} />
                  <UnifiedDashboardWidget />
                </div>
              </LoadingState>
            </TabsContent>

            <TabsContent value="structure">
              <GovernanceStructure onEditMember={handleEditMember} />
            </TabsContent>

            <TabsContent value="policies">
              <CorporatePolicies 
                onEditPolicy={handleEditPolicy}
                onCreatePolicy={() => {
                  setSelectedPolicy(null);
                  setModalMode('create');
                  setIsPolicyModalOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="employees">
              <EmployeesList 
                onEditEmployee={handleEditEmployee}
                onCreateEmployee={() => {
                  setSelectedEmployee(null);
                  setModalMode('create');
                  setIsEmployeeModalOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="risks">
              <ESGRisksMatrix 
                onEditRisk={() => {}} 
                onCreateRisk={() => {}}
              />
            </TabsContent>

            <TabsContent value="ethics">
              <EthicsChannel 
                onViewReport={handleViewReport}
                onInvestigateReport={handleInvestigateReport}
              />
            </TabsContent>

            <TabsContent value="intelligence" className="space-y-6">
              <ErrorBoundary>
                <LazyIntelligenceHub />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance do Sistema</CardTitle>
                  <CardDescription>
                    Monitoramento e otimização do desempenho da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary>
                    <LazySystemPerformanceMonitor />
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modals */}
          <BoardMemberModal
            isOpen={isBoardModalOpen}
            onClose={() => {
              setIsBoardModalOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            onUpdate={refetchData}
          />

          <CorporatePolicyModal
            isOpen={isPolicyModalOpen}
            onClose={() => {
              setIsPolicyModalOpen(false);
              setSelectedPolicy(null);
            }}
            policy={selectedPolicy}
            onUpdate={refetchData}
          />

          <WhistleblowerModal
            isOpen={isWhistleblowerModalOpen}
            onClose={() => {
              setIsWhistleblowerModalOpen(false);
              setSelectedReport(null);
            }}
            report={selectedReport}
            mode={modalMode as any}
            onUpdate={refetchData}
          />

          <EmployeeModal
            isOpen={isEmployeeModalOpen}
            onClose={() => {
              setIsEmployeeModalOpen(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
            onSuccess={refetchData}
          />

          <GovernanceReportsModal
            isOpen={isReportsModalOpen}
            onClose={() => setIsReportsModalOpen(false)}
          />
        </div>
      </ErrorBoundary>
    );
  }