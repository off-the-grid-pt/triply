const messages: Record<string, string> = {
  created: "Viagem criada com sucesso.",
  updated: "Alterações guardadas com sucesso.",
  restored: "Viagem restaurada com sucesso.",
  archived: "Viagem arquivada com sucesso.",
  deleted: "Viagem eliminada permanentemente.",
};

export function StatusMessage({ kind }: { kind?: string }) {
  const message = kind ? messages[kind] : undefined;
  return message ? <p role="status" className="rounded-control border border-success bg-success-muted p-4 text-sm font-medium text-success">{message}</p> : null;
}
