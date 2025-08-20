import React, { useState, useMemo } from 'react'
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
    totalConcluidos: 9,
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
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>('hoje')
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Categoria[]>(['todas'])

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
            onClick={() => setPeriodoSelecionado(periodo.key as Periodo)}
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
          if (value === 'todas') {
            setCategoriasSelecionadas(['todas'])
          } else {
            setCategoriasSelecionadas(value.split(',') as Categoria[])
          }
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

  const renderResumoCard = () => {
    const dados = dadosFiltrados.hoje
    const percentual = dados.totalPlanejados > 0 ? Math.round((dados.totalConcluidos / dados.totalPlanejados) * 100) : 0

    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Resumo - Hoje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {dados.totalPlanejados} planejados / {dados.totalConcluidos} concluídos
            </p>
            <p className="text-lg text-muted-foreground">({percentual}%)</p>
          </div>
          <Progress value={percentual} className="h-3" />
          <Button 
            onClick={scrollToGraficos}
            className="w-full bg-primary hover:bg-primary-hover"
          >
            Ver detalhes
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