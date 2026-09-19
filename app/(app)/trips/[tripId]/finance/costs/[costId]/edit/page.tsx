import { notFound } from "next/navigation";
import { ArchiveCost } from "@/features/finance/components/archive-cost";
import { CostForm } from "@/features/finance/components/finance-form";
import { getOwnedCost,getOwnedFinance } from "@/features/finance/queries";
import { getOwnedRoute } from "@/features/route/queries";
import { getOwnedTrip } from "@/features/trips/queries";
import { Shell } from "@/features/finance/components/form-shell";
export default async function EditCostPage({params}:PageProps<"/trips/[tripId]/finance/costs/[costId]/edit">){const{tripId,costId}=await params,[trip,route,data,cost]=await Promise.all([getOwnedTrip(tripId),getOwnedRoute(tripId),getOwnedFinance(tripId),getOwnedCost(tripId,costId)]);if(!trip||!route||!data||!cost)notFound();return <Shell tripId={tripId} title="Editar custo"><CostForm trip={trip} route={route} categories={data.categories.filter(c=>!c.archivedAt||c.id===cost.categoryId)} cost={cost}/><ArchiveCost tripId={tripId} costId={costId} archived={cost.archivedAt!==null}/></Shell>}
