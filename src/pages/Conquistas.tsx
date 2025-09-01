import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'

// Dados mockados conforme especificado
const MOCK_DATA = {
  hoje: {
    totalPlanejados: 12,
    totalConcluidos: 7,
    faltando: 3,
    atrasados: 1,
    excluidos: 1,
    categorias: {
      medicacoes: { planejados: 6, concluidos: 5 },
      consultas: { planejados: 2, concluidos: 1 },
      exames: { planejados: 1, concluidos: 1 },
      atividades: { planejados: 3, concluidos: 2 }
    }
  },
  semana: [
    { dia: 'Seg', planejados: 10, concluidos: 8 },
    { dia: 'Ter', planejados: 8, concluidos: 8 },
    { dia: 'Qua', planejados: 9, concluidos: 6 },
    { dia: 'Qui', planejados: 12, concluidos: 10 },
    { dia: 'Sex', planejados: 11, concluidos: 9 },
    { dia: 'Sáb', planejados: 6, concluidos: 3 },
    { dia: 'Dom', planejados: 7, concluidos: 5 }
  ],
  mes: [
    { semana: 'Semana 1', planejados: 40, concluidos: 32 },
    { semana: 'Semana 2', planejados: 36, concluidos: 30 },
    { semana: 'Semana 3', planejados: 38, concluidos: 34 },
    { semana: 'Semana 4', planejados: 35, concluidos: 29 }
  ],
  historico: [
    { mes: 'Jul', perc: 68 },
    { mes: 'Ago', perc: 75 },
    { mes: 'Set', perc: 78 },
    { mes: 'Out', perc: 82 }
  ]
}

const CATEGORIA_LABELS = {
  medicacoes: 'Medicações',
  consultas: 'Consultas',
  exames: 'Exames',
  atividades: 'Atividades'
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'historico'
type Categoria = keyof typeof CATEGORIA_LABELS | 'todas'

export default function Conquistas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>('hoje')
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Categoria[]>(['todas'])

  // Sincronizar com URL params
  useEffect(() => {
    const periodo = searchParams.get('periodo') as Periodo
    const categoria = searchParams.get('cat') as Categoria
    
    if (periodo && ['hoje', 'semana', 'mes', 'historico'].includes(periodo)) {
      setPeriodoSelecionado(periodo)
    }
    
    if (categoria && Object.keys(CATEGORIA_LABELS).includes(categoria)) {
      setCategoriasSelecionadas([categoria])
    } else if (categoria === 'todas') {
      setCategoriasSelecionadas(['todas'])
    }
  }, [searchParams])

  // Atualizar URL quando filtros mudarem
  const updateFilters = (novoPeriodo?: Periodo, novaCategoria?: Categoria[]) => {
    const newParams = new URLSearchParams(searchParams)
    
    if (novoPeriodo) {
      newParams.set('periodo', novoPeriodo)
    }
    
    if (novaCategoria) {
      if (novaCategoria.includes('todas')) {
        newParams.delete('cat')
      } else {
        newParams.set('cat', novaCategoria.join(','))
      }
    }
    
    setSearchParams(newParams)
  }

  // Função para calcular dados filtrados
  const dadosFiltrados = useMemo(() => {
    if (categoriasSelecionadas.includes('todas')) {
      return MOCK_DATA
    }

    // Filtrar dados por categoria
    const dadosFiltrasdos = { ...MOCK_DATA }
    
    // Para 'hoje', filtrar categorias
    if (periodoSelecionado === 'hoje') {
      const categoriasFiltradasHoje = Object.keys(dadosFiltrasdos.hoje.categorias)
        .filter(cat => categoriasSelecionadas.includes(cat as Categoria))
        .reduce((acc, cat) => {
          acc[cat] = dadosFiltrasdos.hoje.categorias[cat as keyof typeof dadosFiltrasdos.hoje.categorias]
          return acc
        }, {} as Record<string, { planejados: number; concluidos: number }>)

      const totalPlanejados = Object.values(categoriasFiltradasHoje).reduce((sum, cat) => sum + cat.planejados, 0)
      const totalConcluidos = Object.values(categoriasFiltradasHoje).reduce((sum, cat) => sum + cat.concluidos, 0)

      dadosFiltrasdos.hoje = {
        totalPlanejados,
        totalConcluidos,
        faltando: Math.floor(totalPlanejados * 0.25), // Mock: 25% faltando
        atrasados: Math.floor(totalPlanejados * 0.08), // Mock: 8% atrasados  
        excluidos: Math.floor(totalPlanejados * 0.08), // Mock: 8% excluídos
        categorias: categoriasFiltradasHoje as any
      }
    }

    return dadosFiltrasdos
  }, [categoriasSelecionadas, periodoSelecionado])

  const scrollToGraficos = () => {
    const elemento = document.getElementById('graficos-section')
    elemento?.scrollIntoView({ behavior: 'smooth' })
  }

  const renderPeriodChips = () => {
    const periodos = [
      { key: 'hoje', label: 'Hoje' },
      { key: 'semana', label: 'Semana' },
      { key: 'mes', label: 'Mês' },
      { key: 'historico', label: 'Histórico' }
    ]

    return (
      <div className="flex flex-wrap gap-2">
        {periodos.map(periodo => (
          <Badge
            key={periodo.key}
            variant={periodoSelecionado === periodo.key ? 'default' : 'secondary'}
            className={`cursor-pointer px-3 py-1 ${
              periodoSelecionado === periodo.key 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-filter-neutral text-filter-neutral-foreground hover:bg-primary/10'
            }`}
            onClick={() => {
              setPeriodoSelecionado(periodo.key as Periodo)
              updateFilters(periodo.key as Periodo, categoriasSelecionadas)
            }}
            aria-label={`Filtrar por período: ${periodo.label}`}
          >
            {periodo.label}
          </Badge>
        ))}
      </div>
    )
  }

  const renderCategoriaSelect = () => {
    return (
      <Select
        value={categoriasSelecionadas.includes('todas') ? 'todas' : categoriasSelecionadas.join(',')}
        onValueChange={(value) => {
          let novaCategoria: Categoria[]
          if (value === 'todas') {
            novaCategoria = ['todas']
          } else {
            novaCategoria = value.split(',') as Categoria[]
          }
          setCategoriasSelecionadas(novaCategoria)
          updateFilters(periodoSelecionado, novaCategoria)
        }}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Selecionar categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as categorias</SelectItem>
          {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Função para calcular métricas detalhadas
  const calcularMetricas = (dados: typeof MOCK_DATA.hoje) => {
    const P = dados.totalPlanejados
    const C = dados.totalConcluidos
    const F = dados.faltando || 0
    const A = dados.atrasados || 0
    const E = dados.excluidos || 0

    // Garantir que C + F + A + E == P (reconciliação)
    const total = C + F + A + E
    if (total !== P && P > 0) {
      console.warn(`Inconsistência nos dados: ${total} !== ${P}`)
    }

    // Calcular percentuais (0 quando P == 0)
    const concluidosPct = P > 0 ? Math.round((C / P) * 100) : 0
    const faltandoPct = P > 0 ? Math.round((F / P) * 100) : 0
    const atrasadosPct = P > 0 ? Math.round((A / P) * 100) : 0
    const excluidosPct = P > 0 ? Math.round((E / P) * 100) : 0

    return {
      P, C, F, A, E,
      concluidosPct,
      faltandoPct,
      atrasadosPct,
      excluidosPct,
      aderencia: concluidosPct
    }
  }

  const renderResumoCard = () => {
    const dados = dadosFiltrados.hoje
    const metricas = calcularMetricas(dados)

    // Estado quando P == 0
    if (metricas.P === 0) {
      return (
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20 shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Resumo Hoje</h3>
                <p className="text-sm text-muted-foreground">Progresso diário</p>
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20">
                <span className="text-2xl font-bold text-primary">0%</span>
              </div>
            </div>
            
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg">Nenhum compromisso no período</p>
            </div>

            <Button 
              onClick={scrollToGraficos}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11 font-medium"
            >
              Adicionar na Agenda
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 opacity-60"></div>
        <CardContent className="relative p-6 space-y-6" aria-live="polite">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Resumo Hoje</h3>
              <p className="text-sm text-muted-foreground">Progresso diário</p>
            </div>
            <div className="relative w-20 h-20">
              {/* Círculo de progresso - rotacionado */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, #16a34a ${metricas.aderencia * 3.6}deg, #e5e7eb ${metricas.aderencia * 3.6}deg)`,
                  transform: 'rotate(-90deg)',
                  padding: '4px'
                }}
              >
                <div className="w-full h-full rounded-full bg-background"></div>
              </div>
              
              {/* Texto central - não rotacionado */}
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{metricas.aderencia}%</span>
              </div>
            </div>
          </div>

          {/* Barra de progresso segmentada */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{metricas.C} de {metricas.P}</span>
            </div>
            
            <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
              {/* Segmentos proporcionais */}
              <div className="flex h-full">
                {metricas.C > 0 && (
                  <div 
                    className="bg-[#344E41] h-full transition-all duration-300"
                    style={{ width: `${metricas.concluidosPct}%` }}
                    aria-label={`Concluídos: ${metricas.C} (${metricas.concluidosPct}%)`}
                  />
                )}
                {metricas.F > 0 && (
                  <div 
                    className="bg-[#588157] h-full transition-all duration-300"
                    style={{ width: `${metricas.faltandoPct}%` }}
                    aria-label={`Faltando: ${metricas.F} (${metricas.faltandoPct}%)`}
                  />
                )}
                {metricas.A > 0 && (
                  <div 
                    className="bg-[#E67E22] h-full transition-all duration-300"
                    style={{ width: `${metricas.atrasadosPct}%` }}
                    aria-label={`Atrasados: ${metricas.A} (${metricas.atrasadosPct}%)`}
                  />
                )}
                {metricas.E > 0 && (
                  <div 
                    className="bg-[#DAD7CD] h-full transition-all duration-300"
                    style={{ width: `${metricas.excluidosPct}%` }}
                    aria-label={`Excluídos: ${metricas.E} (${metricas.excluidosPct}%)`}
                  />
                )}
              </div>
            </div>

            {/* Legenda compacta */}
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#344E41] rounded-full"></div>
                <span className="text-muted-foreground">Concluídos</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#588157] rounded-full"></div>
                <span className="text-muted-foreground">Faltando</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#E67E22] rounded-full"></div>
                <span className="text-muted-foreground">Atrasados</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#DAD7CD] rounded-full"></div>
                <span className="text-muted-foreground">Excluídos</span>
              </div>
            </div>
          </div>

          {/* Linha de métricas - 4 cards compactos em uma linha */}
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-4">
              {/* Concluídos */}
              <div className="flex-shrink-0 w-20 md:w-full text-center p-3 rounded-lg bg-background/50 border border-border/50 relative">
                <div className="relative inline-block">
                  <p className="text-xl font-bold text-[#344E41] mt-2">{metricas.C}</p>
                  <span className="absolute -top-1 -right-1 text-xs font-semibold text-[#344E41]/70 bg-[#344E41]/10 px-1 rounded text-right">
                    {metricas.concluidosPct}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Concluídos</p>
              </div>

              {/* Faltando */}
              <div className="flex-shrink-0 w-20 md:w-full text-center p-3 rounded-lg bg-background/50 border border-border/50 relative">
                <div className="relative inline-block">
                  <p className="text-xl font-bold text-[#588157]">{metricas.F}</p>
                  <span className="absolute -top-2 -right-1 text-xs font-semibold text-[#588157]/70 bg-[#588157]/10 px-1 rounded text-right">
                    {metricas.faltandoPct}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Faltando</p>
              </div>

              {/* Atrasados */}
              <div className="flex-shrink-0 w-20 md:w-full text-center p-3 rounded-lg bg-background/50 border border-border/50 relative">
                <div className="relative inline-block">
                  <p className="text-xl font-bold text-[#E67E22]">{metricas.A}</p>
                  <span className="absolute -top-2 -right-1 text-xs font-semibold text-[#E67E22]/70 bg-[#E67E22]/10 px-1 rounded text-right">
                    {metricas.atrasadosPct}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Atrasados</p>
              </div>

              {/* Excluídos */}
              <div className="flex-shrink-0 w-20 md:w-full text-center p-3 rounded-lg bg-background/50 border border-border/50 relative">
                <div className="relative inline-block">
                  <p className="text-xl font-bold text-destructive">{metricas.E}</p>
                  <span className="absolute -top-2 -right-1 text-xs font-semibold text-[#DAD7CD]/70 bg-[#DAD7CD]/20 px-1 rounded text-right">
                    {metricas.excluidosPct}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Excluídos</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={scrollToGraficos}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Ver análise detalhada</span>
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const renderMiniCards = () => {
    const dados = dadosFiltrados.hoje.categorias

    if (Object.keys(dados).length === 0) {
      return (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground opacity-70">
              Nenhum compromisso para as categorias selecionadas
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(dados).map(([key, categoria]) => {
          const percentual = categoria.planejados > 0 ? Math.round((categoria.concluidos / categoria.planejados) * 100) : 0
          return (
            <Card key={key} className="shadow-card">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2">{CATEGORIA_LABELS[key as keyof typeof CATEGORIA_LABELS]}</h3>
                <p className="text-xs text-muted-foreground">
                  {categoria.planejados} planejados / {categoria.concluidos} concluídos
                </p>
                <p className="text-lg font-bold text-primary">{percentual}%</p>
                <Progress value={percentual} className="h-2 mt-2" />
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderGraficoSemana = () => {
    const dados = dadosFiltrados.semana.map(item => ({
      ...item,
      percentual: item.planejados > 0 ? Math.round((item.concluidos / item.planejados) * 100) : 0
    }))

    const media = Math.round(dados.reduce((sum, item) => sum + item.percentual, 0) / dados.length)

    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Progresso Semanal</CardTitle>
          <p className="text-sm text-muted-foreground">Média semanal: {media}% concluído</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="dia" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Bar 
                dataKey="percentual" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Percentual Concluído (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  const renderGraficoMes = () => {
    const dados = dadosFiltrados.mes.map(item => ({
      ...item,
      percentual: item.planejados > 0 ? Math.round((item.concluidos / item.planejados) * 100) : 0
    }))

    const media = Math.round(dados.reduce((sum, item) => sum + item.percentual, 0) / dados.length)

    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Progresso Mensal</CardTitle>
          <p className="text-sm text-muted-foreground">Média do mês: {media}% concluído</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="semana" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Bar 
                dataKey="percentual" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Percentual Concluído (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  const renderGraficoHistorico = () => {
    const dados = dadosFiltrados.historico
    const evolucao = dados.length > 1 ? dados[dados.length - 1].perc - dados[dados.length - 2].perc : 0

    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Evolução Histórica</CardTitle>
          <p className="text-sm text-muted-foreground">
            Evolução: {dados[dados.length - 2]?.perc}% → {dados[dados.length - 1]?.perc}% 
            ({evolucao > 0 ? '+' : ''}{evolucao}%)
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="mes" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="perc" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "hsl(var(--success))", strokeWidth: 2 }}
                name="Percentual Concluído (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  const renderGraficos = () => {
    switch (periodoSelecionado) {
      case 'hoje':
        return renderMiniCards()
      case 'semana':
        return renderGraficoSemana()
      case 'mes':
        return renderGraficoMes()
      case 'historico':
        return renderGraficoHistorico()
      default:
        return <div className="text-center text-muted-foreground">Selecione um período</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Minhas Conquistas</h1>
              <p className="text-muted-foreground">Resumo de compromissos concluídos</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {renderPeriodChips()}
              {renderCategoriaSelect()}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Card Resumo */}
        {renderResumoCard()}

        {/* Seção de Gráficos */}
        <div id="graficos-section" className="space-y-6">
          <h2 className="text-xl font-semibold text-primary">
            Progresso - {periodoSelecionado.charAt(0).toUpperCase() + periodoSelecionado.slice(1)}
          </h2>
          {renderGraficos()}
        </div>
      </div>
    </div>
  )
}