export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-[#0D0A14] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50">Faturamento do mês</p>
          <p className="text-2xl font-bold text-white">R$ 0,00</p>
        </div>
        <div className="bg-[#0D0A14] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50">Pedidos em aberto</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-[#0D0A14] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50">Mêsversários ativos</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-[#0D0A14] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-white/50">Receita recorrente</p>
          <p className="text-2xl font-bold text-white">R$ 0,00</p>
        </div>
      </div>
      <div className="mt-6 border border-white/10 rounded-lg p-6 bg-[#0D0A14]">
        <p className="text-white/50 text-center">Nenhuma entrega nos próximos dias.</p>
      </div>
    </div>
  )
}
