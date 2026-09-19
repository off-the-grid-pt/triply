const messages: Record<string, string> = {
  destinationAdded: "Destino adicionado com sucesso.", destinationUpdated: "Destino atualizado com sucesso.",
  destinationDeleted: "Destino eliminado e rota reconciliada.", routeReordered: "Nova ordem guardada; transportes afetados foram preservados para revisão.",
  transportAdded: "Transporte adicionado com sucesso.", transportUpdated: "Transporte atualizado com sucesso.", transportDeleted: "Transporte eliminado com sucesso.",
};
export function RouteStatus({ query }: { query: Record<string, string | string[] | undefined> }) {
  const key = Object.keys(messages).find((item) => query[item]);
  return key ? <p role="status" className="mt-6 rounded-control border border-success bg-success-muted p-4 text-sm font-medium text-success">{messages[key]}</p> : null;
}
