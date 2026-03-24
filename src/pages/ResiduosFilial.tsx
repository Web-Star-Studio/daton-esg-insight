import { useParams } from "react-router-dom"
import Residuos from "./Residuos"

const ResiduosFilial = () => {
  const { branchId } = useParams<{ branchId: string }>()
  return <Residuos lockedBranchId={branchId} />
}

export default ResiduosFilial
