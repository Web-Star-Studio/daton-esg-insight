export function getBranchDisplayLabel(branch: { code?: string | null; name: string }): string {
  return branch.code ? `${branch.code} - ${branch.name}` : branch.name;
}

export function getBranchShortLabel(branch: { code?: string | null; name: string }): string {
  return branch.code || branch.name;
}
