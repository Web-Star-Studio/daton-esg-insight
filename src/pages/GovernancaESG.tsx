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
  UserPlus,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBoardMembers, getCorporatePolicies, getWhistleblowerReports, getGovernanceMetrics } from "@/services/governance";
import { getESGRisks, getRiskMetrics } from "@/services/esgRisks";
import { getEmployees, getEmployeesStats } from "@/services/employees";
import { BoardMemberModal } from "@/components/BoardMemberModal";
import { CorporatePolicyModal } from "@/components/CorporatePolicyModal";
import { WhistleblowerModal } from "@/components/WhistleblowerModal";
import { ESGRiskModal } from "@/components/ESGRiskModal";
import { GovernanceReportsModal } from "@/components/GovernanceReportsModal";
import { EmployeeModal } from "@/components/EmployeeModal";
import { EmployeeDetailModal } from "@/components/EmployeeDetailModal";
import { GovernanceDashboard } from "@/components/GovernanceDashboard";
import { UnifiedDashboardWidget } from "@/components/UnifiedDashboardWidget";
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
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [riskModalMode, setRiskModalMode] = useState<'create' | 'edit'>('create');

  // Optimized queries with caching and error handling
  const { data: governanceMetrics, isLoading: loadingGovernance, error: governanceError } = useOptimizedQuery({
    queryKey: ['governance-metrics'],
    queryFn: getGovernanceMetrics,
    priority: 'standard',
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

  const handleViewEmployee = (employee: any) => {
    setViewingEmployee(employee);
    setIsEmployeeDetailModalOpen(true);
  };

  const handleEditFromDetail = () => {
    setSelectedEmployee(viewingEmployee);
    setIsEmployeeDetailModalOpen(false);
    setIsEmployeeModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsEmployeeDetailModalOpen(false);
    setViewingEmployee(null);
  };

  const handleCreateRisk = () => {
    setSelectedRisk(null);
    setRiskModalMode('create');
    setIsRiskModalOpen(true);
  };

  const handleEditRisk = (risk: any) => {
    setSelectedRisk(risk);
    setRiskModalMode('edit');
    setIsRiskModalOpen(true);
  };

  const handleCloseRiskModal = () => {
    setIsRiskModalOpen(false);
    setSelectedRisk(null);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Registro
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => {
                    setSelectedMember(null);
                    setModalMode('create');
                    setIsBoardModalOpen(true);
                  }}>
                    <Users className="mr-2 h-4 w-4" />
                    Novo Conselheiro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedPolicy(null);
                    setModalMode('create');
                    setIsPolicyModalOpen(true);
                  }}>
                    <FileText className="mr-2 h-4 w-4" />
                    Nova Política
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateRisk}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Novo Risco ESG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedReport(null);
                    setModalMode('create');
                    setIsWhistleblowerModalOpen(true);
                  }}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Nova Denúncia
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedEmployee(null);
                    setModalMode('create');
                    setIsEmployeeModalOpen(true);
                  }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Funcionário
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="structure">Estrutura</TabsTrigger>
              <TabsTrigger value="policies">Políticas</TabsTrigger>
              <TabsTrigger value="employees">Funcionários</TabsTrigger>
              <TabsTrigger value="risks">Riscos ESG</TabsTrigger>
              <TabsTrigger value="ethics">Ética</TabsTrigger>
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
              <GovernanceStructure 
                onEditMember={handleEditMember}
                onCreateMember={() => {
                  setSelectedMember(null);
                  setModalMode('create');
                  setIsBoardModalOpen(true);
                }}
              />
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
                onViewEmployee={handleViewEmployee}
              />
            </TabsContent>

            <TabsContent value="risks">
              <ESGRisksMatrix 
                onEditRisk={handleEditRisk} 
                onCreateRisk={handleCreateRisk}
              />
            </TabsContent>

            <TabsContent value="ethics">
              <EthicsChannel 
                onViewReport={handleViewReport}
                onInvestigateReport={handleInvestigateReport}
                onCreateReport={() => {
                  setSelectedReport(null);
                  setModalMode('create');
                  setIsWhistleblowerModalOpen(true);
                }}
              />
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

          <EmployeeDetailModal
            isOpen={isEmployeeDetailModalOpen}
            onClose={handleDetailModalClose}
            onEdit={handleEditFromDetail}
            employee={viewingEmployee}
          />

          <GovernanceReportsModal
            isOpen={isReportsModalOpen}
            onClose={() => setIsReportsModalOpen(false)}
          />

          <ESGRiskModal
            isOpen={isRiskModalOpen}
            onClose={handleCloseRiskModal}
            risk={selectedRisk}
            mode={riskModalMode}
          />
        </div>
      </ErrorBoundary>
    );
  }