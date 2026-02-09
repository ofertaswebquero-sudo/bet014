import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, X, ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";

interface StakeCalculatorProps {
  bancaTotal?: number;
  unitValue?: number;
  maxRiskPercent?: number;
}

export function StakeCalculator({ 
  bancaTotal = 10000, 
  unitValue = 100,
  maxRiskPercent = 2 
}: StakeCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Estado para cálculos
  const [mode, setMode] = useState<'unit' | 'percent' | 'fixed'>('unit');
  const [units, setUnits] = useState("1");
  const [percent, setPercent] = useState("2");
  const [fixedValue, setFixedValue] = useState("100");
  const [customBanca, setCustomBanca] = useState(bancaTotal.toString());
  const [customUnit, setCustomUnit] = useState(unitValue.toString());
  
  // Resultado calculado
  const [calculatedStake, setCalculatedStake] = useState(0);
  
  useEffect(() => {
    const banca = parseFloat(customBanca) || 0;
    const unit = parseFloat(customUnit) || 0;
    
    switch (mode) {
      case 'unit':
        setCalculatedStake((parseFloat(units) || 0) * unit);
        break;
      case 'percent':
        setCalculatedStake(banca * ((parseFloat(percent) || 0) / 100));
        break;
      case 'fixed':
        setCalculatedStake(parseFloat(fixedValue) || 0);
        break;
    }
  }, [mode, units, percent, fixedValue, customBanca, customUnit]);

  // Verificar se stake ultrapassa limite
  const isOverLimit = calculatedStake > (parseFloat(customBanca) || 0) * (maxRiskPercent / 100);
  const percentOfBanca = ((calculatedStake / (parseFloat(customBanca) || 1)) * 100).toFixed(2);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg"
        size="lg"
      >
        <Calculator className="h-5 w-5" />
        Calculadora de Stake
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-xl border-primary/20">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Calculadora de Stake
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          {/* Configuração base */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Banca Total</Label>
              <Input
                type="number"
                value={customBanca}
                onChange={(e) => setCustomBanca(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor Unit</Label>
              <Input
                type="number"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Tabs de modo */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="unit" className="text-xs py-1">Unidades</TabsTrigger>
              <TabsTrigger value="percent" className="text-xs py-1">% Banca</TabsTrigger>
              <TabsTrigger value="fixed" className="text-xs py-1">Fixo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unit" className="mt-2">
              <div className="space-y-1">
                <Label className="text-xs">Quantidade de Units</Label>
                <div className="flex gap-1">
                  {['0.5', '1', '2', '3', '5'].map((v) => (
                    <Button
                      key={v}
                      variant={units === v ? "default" : "outline"}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setUnits(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  step="0.5"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="Ou digite..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="percent" className="mt-2">
              <div className="space-y-1">
                <Label className="text-xs">% da Banca</Label>
                <div className="flex gap-1">
                  {['1', '2', '3', '5', '10'].map((v) => (
                    <Button
                      key={v}
                      variant={percent === v ? "default" : "outline"}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setPercent(v)}
                    >
                      {v}%
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  step="0.5"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="Ou digite..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="fixed" className="mt-2">
              <div className="space-y-1">
                <Label className="text-xs">Valor Fixo (R$)</Label>
                <Input
                  type="number"
                  step="10"
                  value={fixedValue}
                  onChange={(e) => setFixedValue(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Resultado */}
          <div className={`p-3 rounded-lg ${isOverLimit ? 'bg-destructive/10 border border-destructive/30' : 'bg-primary/10'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Stake Calculada</span>
              <Badge variant={isOverLimit ? "destructive" : "secondary"} className="text-xs">
                {percentOfBanca}% da banca
              </Badge>
            </div>
            <p className={`text-2xl font-bold ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(calculatedStake)}
            </p>
            {isOverLimit && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Acima do limite de risco ({maxRiskPercent}%)
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
