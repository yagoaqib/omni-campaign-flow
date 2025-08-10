import NumbersPerformancePanel from "@/components/dashboard/NumbersPerformancePanel";

export default function Performance() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Performance dos Números</h1>
        <p className="text-muted-foreground">
          Monitore em tempo real a velocidade de disparo de cada número para otimizar campanhas em volume
        </p>
      </div>
      
      <NumbersPerformancePanel />
    </div>
  );
}