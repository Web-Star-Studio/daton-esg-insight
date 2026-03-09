import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

vi.mock("@/services/documentAI", () => ({
  processDocumentWithAI: vi.fn(),
}));

vi.mock("@/services/documents", () => ({
  downloadDocument: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock("@/services/documentBranches", () => ({
  getDocumentsBranchesMap: vi.fn(),
  linkDocumentToBranches: vi.fn(),
  updateDocumentBranches: vi.fn(),
}));

vi.mock("@/services/gedDocuments", () => ({
  documentVersionsService: {
    getVersions: vi.fn(),
  },
}));

import { applyDocumentCenterFilters, mergeDocumentTimelineEntries, type DocumentRecord } from "@/services/documentCenter";

const baseDocument: DocumentRecord = {
  id: "doc-1",
  company_id: "company-1",
  title: "Procedimento de Frota",
  file_name: "procedimento-frota.pdf",
  file_path: "documents/doc-1.pdf",
  file_type: "application/pdf",
  file_size: 1024,
  upload_date: "2026-03-01T10:00:00.000Z",
  tags: ["frota", "pneus"],
  related_model: "quality_document",
  related_id: "company-1",
  uploader_user_id: "user-1",
  ai_processing_status: "completed",
  ai_confidence_score: 0.93,
  ai_extracted_category: "Procedimento",
  summary: "Padrao operacional da frota.",
  document_kind: "controlled",
  document_domain: "quality",
  status: "active",
  branch_ids: ["branch-1"],
  branches: [{ branch_id: "branch-1", name: "Matriz", code: "HQ" }],
  current_version_number: 4,
  latest_extraction: null,
  control_profile: {
    document_id: "doc-1",
    code: "PSG-001",
    document_type_label: "Procedimento",
    norm_reference: "ISO 9001",
    issuer_name: "Qualidade",
    confidentiality_level: "internal",
    validity_start_date: "2026-01-01",
    validity_end_date: "2026-12-31",
    review_due_date: "2026-10-01",
    responsible_department: "Qualidade",
    controlled_copy: true,
  },
  pending_read_count: 2,
  open_request_count: 1,
};

describe("documentCenter helpers", () => {
  it("filters controlled documents with pending reads and branch scope", () => {
    const result = applyDocumentCenterFilters([baseDocument], {
      documentKind: "controlled",
      branchId: "branch-1",
      readState: "pending",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("doc-1");
  });

  it("excludes documents that fail validity and request filters", () => {
    const expiredDocument: DocumentRecord = {
      ...baseDocument,
      id: "doc-2",
      title: "Checklist de Patio",
      pending_read_count: 0,
      open_request_count: 0,
      control_profile: {
        ...baseDocument.control_profile!,
        document_id: "doc-2",
        validity_end_date: "2025-01-01",
      },
    };

    const result = applyDocumentCenterFilters([expiredDocument], {
      validityState: "active",
      requestState: "open",
    });

    expect(result).toHaveLength(0);
  });

  it("merges versions, change log and audit trail in descending order", () => {
    const timeline = mergeDocumentTimelineEntries(
      [
        {
          id: "version-1",
          document_id: "doc-1",
          version_number: 4,
          title: "Rev. 4",
          changes_summary: "Atualizacao de layout",
          created_by_user_id: "user-1",
          created_at: "2026-03-05T12:00:00.000Z",
          is_current: true,
        },
      ],
      [
        {
          id: "change-1",
          change_type: "metadata_update",
          summary: "Cabecalho SGQ atualizado",
          diff: { field: "issuer_name" },
          created_by_user_id: "user-2",
          created_at: "2026-03-04T12:00:00.000Z",
        },
      ],
      [
        {
          id: "audit-1",
          action: "READ_CONFIRMATION",
          details: "Leitura confirmada",
          user_id: "user-3",
          old_values: null,
          new_values: null,
          timestamp: "2026-03-03T12:00:00.000Z",
        },
      ],
    );

    expect(timeline).toHaveLength(3);
    expect(timeline.map((entry) => entry.kind)).toEqual(["version", "change", "audit"]);
    expect(timeline[0].title).toContain("Revis");
    expect(timeline[1].title).toBe("Cabecalho SGQ atualizado");
    expect(timeline[2].description).toBe("Leitura confirmada");
  });
});
