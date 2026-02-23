import { type ReportTemplate } from "./types"

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "esg_comprehensive",
    name: "Comprehensive ESG Report",
    description:
      "Complete environmental, social, and governance assessment",
    category: "esg",
    frequency: "quarterly",
    sections: [
      "Executive Summary",
      "Environmental Impact",
      "Social Responsibility",
      "Governance",
      "Recommendations"
    ],
    format: "pdf",
    automated: true
  },
  {
    id: "compliance_audit",
    name: "Compliance Audit Report",
    description: "Regulatory compliance status and risk assessment",
    category: "compliance",
    frequency: "monthly",
    sections: [
      "Compliance Status",
      "Risk Analysis",
      "Policy Updates",
      "Action Items"
    ],
    format: "pdf",
    automated: true
  },
  {
    id: "sustainability_dashboard",
    name: "Sustainability Performance",
    description: "Key sustainability metrics and progress tracking",
    category: "sustainability",
    frequency: "monthly",
    sections: [
      "Carbon Footprint",
      "Resource Usage",
      "Waste Management",
      "Energy Efficiency"
    ],
    format: "html",
    automated: true
  },
  {
    id: "performance_analytics",
    name: "Performance Analytics",
    description: "System performance and optimization insights",
    category: "performance",
    frequency: "weekly",
    sections: [
      "System Metrics",
      "User Analytics",
      "Performance Trends",
      "Optimization Opportunities"
    ],
    format: "html",
    automated: true
  }
]
