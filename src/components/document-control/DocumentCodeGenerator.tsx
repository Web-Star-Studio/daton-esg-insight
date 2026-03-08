import { type DocumentLevel, getCodePrefix } from "./DocumentLevelBadge";

/**
 * Auto-generates the next document code based on the level.
 * Pattern: PSG-XX, IT-XX.YY, RG-XX.ZZ, MSG-XX.YY, FPLAN-XXX
 */
export function generateDocumentCode(
  level: DocumentLevel,
  existingCodes: string[],
  parentCode?: string
): string {
  const prefix = getCodePrefix(level);

  const relevantCodes = existingCodes
    .filter((c) => c.toUpperCase().startsWith(prefix.toUpperCase()))
    .map((c) => c.toUpperCase());

  switch (level) {
    case "nivel_1_msg": {
      // MSG-XX.YY
      const nums = relevantCodes
        .map((c) => {
          const m = c.match(/^MSG-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter(Boolean);
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `MSG-${String(next).padStart(2, "0")}.01`;
    }
    case "nivel_2_psg": {
      // PSG-XX
      const nums = relevantCodes
        .map((c) => {
          const m = c.match(/^PSG-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter(Boolean);
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `PSG-${String(next).padStart(2, "0")}`;
    }
    case "nivel_3_it_pso": {
      // IT-XX.YY (XX from parent PSG)
      if (parentCode) {
        const parentMatch = parentCode.match(/PSG-(\d+)/i);
        const parentNum = parentMatch ? parentMatch[1] : "01";
        const subNums = relevantCodes
          .filter((c) => c.startsWith(`IT-${parentNum}.`))
          .map((c) => {
            const m = c.match(/^IT-\d+\.(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter(Boolean);
        const next = subNums.length > 0 ? Math.max(...subNums) + 1 : 1;
        return `IT-${parentNum}.${String(next).padStart(2, "0")}`;
      }
      const nums = relevantCodes
        .map((c) => {
          const m = c.match(/^IT-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter(Boolean);
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `IT-${String(next).padStart(2, "0")}.01`;
    }
    case "nivel_4_rg": {
      // RG-XX.ZZ
      if (parentCode) {
        const parentMatch = parentCode.match(/(?:PSG|IT)-(\d+)/i);
        const parentNum = parentMatch ? parentMatch[1] : "01";
        const subNums = relevantCodes
          .filter((c) => c.startsWith(`RG-${parentNum}.`))
          .map((c) => {
            const m = c.match(/^RG-\d+\.(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter(Boolean);
        const next = subNums.length > 0 ? Math.max(...subNums) + 1 : 1;
        return `RG-${parentNum}.${String(next).padStart(2, "0")}`;
      }
      const nums = relevantCodes
        .map((c) => {
          const m = c.match(/^RG-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter(Boolean);
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `RG-${String(next).padStart(2, "0")}.01`;
    }
    case "nivel_5_fplan": {
      // FPLAN-XXX
      const nums = relevantCodes
        .map((c) => {
          const m = c.match(/^FPLAN-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter(Boolean);
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `FPLAN-${String(next).padStart(3, "0")}`;
    }
    default:
      return `DOC-001`;
  }
}
