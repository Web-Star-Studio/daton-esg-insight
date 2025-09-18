import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface PGRSDocumentData {
  company: {
    name: string
    cnpj: string
    address: string
    responsible_name: string
    responsible_title: string
    art_number?: string
  }
  plan: {
    plan_name: string
    version: string
    creation_date: Date
    revision_date?: Date
  }
  sources: Array<{
    source_name: string
    source_type: string
    location: string
    description: string
    waste_types: Array<{
      waste_name: string
      hazard_class: string
      ibama_code: string
      composition: string
      estimated_quantity_monthly: number
      unit: string
    }>
  }>
  procedures: Array<{
    procedure_type: string
    title: string
    description: string
    infrastructure_details: string
    responsible_role: string
    frequency: string
  }>
  goals: Array<{
    goal_type: string
    baseline_value: number
    target_value: number
    unit: string
    deadline: string
  }>
}

export class PGRSDocumentGenerator {
  private doc: jsPDF
  private yPosition: number = 20
  private pageWidth: number
  private margins = { left: 20, right: 20, top: 20, bottom: 20 }

  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.width
  }

  private addTitle(text: string, size: number = 16, bold: boolean = true) {
    this.doc.setFontSize(size)
    if (bold) this.doc.setFont(undefined, 'bold')
    this.doc.text(text, this.margins.left, this.yPosition)
    if (bold) this.doc.setFont(undefined, 'normal')
    this.yPosition += size * 0.5 + 5
  }

  private addText(text: string, size: number = 10, x?: number) {
    this.doc.setFontSize(size)
    const xPos = x || this.margins.left
    const textLines = this.doc.splitTextToSize(text, this.pageWidth - this.margins.left - this.margins.right)
    
    textLines.forEach((line: string) => {
      if (this.yPosition > 270) {
        this.doc.addPage()
        this.yPosition = this.margins.top
      }
      this.doc.text(line, xPos, this.yPosition)
      this.yPosition += size * 0.5 + 2
    })
  }

  private addSpace(space: number = 5) {
    this.yPosition += space
  }

  private addPageBreak() {
    this.doc.addPage()
    this.yPosition = this.margins.top
  }

  private addTable(headers: string[], data: string[][]) {
    const startY = this.yPosition
    const rowHeight = 8
    const colWidth = (this.pageWidth - this.margins.left - this.margins.right) / headers.length

    // Headers
    this.doc.setFontSize(9)
    this.doc.setFont(undefined, 'bold')
    headers.forEach((header, i) => {
      this.doc.text(header, this.margins.left + (i * colWidth), startY)
    })
    this.doc.setFont(undefined, 'normal')

    // Underline headers
    this.doc.line(this.margins.left, startY + 2, this.pageWidth - this.margins.right, startY + 2)
    
    this.yPosition = startY + rowHeight

    // Data rows
    data.forEach((row) => {
      if (this.yPosition > 270) {
        this.addPageBreak()
      }
      
      row.forEach((cell, i) => {
        const cellText = this.doc.splitTextToSize(cell, colWidth - 5)
        this.doc.text(cellText[0] || '', this.margins.left + (i * colWidth), this.yPosition)
      })
      this.yPosition += rowHeight
    })

    this.addSpace(10)
  }

  generateDocument(data: PGRSDocumentData): string {
    // Capa
    this.addTitle('PLANO DE GERENCIAMENTO DE RESÍDUOS SÓLIDOS', 20, true)
    this.addTitle('(PGRS)', 18, true)
    this.addSpace(30)

    this.addTitle(data.company.name, 14, true)
    this.addText(`CNPJ: ${data.company.cnpj}`)
    this.addSpace(20)

    this.addText(`Versão: ${data.plan.version}`)
    this.addText(`Data de Elaboração: ${format(data.plan.creation_date, 'dd/MM/yyyy', { locale: ptBR })}`)
    if (data.plan.revision_date) {
      this.addText(`Data de Revisão: ${format(data.plan.revision_date, 'dd/MM/yyyy', { locale: ptBR })}`)
    }

    this.addSpace(30)
    this.addText(`Responsável Técnico: ${data.company.responsible_name}`)
    this.addText(`Cargo/Função: ${data.company.responsible_title}`)
    if (data.company.art_number) {
      this.addText(`ART Nº: ${data.company.art_number}`)
    }

    this.addPageBreak()

    // Índice
    this.addTitle('SUMÁRIO', 14, true)
    this.addText('1. IDENTIFICAÇÃO DA EMPRESA')
    this.addText('2. DIAGNÓSTICO DE RESÍDUOS SÓLIDOS')
    this.addText('3. PROCEDIMENTOS OPERACIONAIS')
    this.addText('4. METAS DE REDUÇÃO E MELHORIA')
    this.addText('5. CRONOGRAMA DE IMPLEMENTAÇÃO')
    this.addText('6. RESPONSABILIDADES')
    this.addText('7. MONITORAMENTO E INDICADORES')

    this.addPageBreak()

    // 1. Identificação da Empresa
    this.addTitle('1. IDENTIFICAÇÃO DA EMPRESA', 14, true)
    this.addText(`Razão Social: ${data.company.name}`)
    this.addText(`CNPJ: ${data.company.cnpj}`)
    this.addText(`Endereço: ${data.company.address}`)
    this.addSpace(10)

    // 2. Diagnóstico de Resíduos
    this.addTitle('2. DIAGNÓSTICO DE RESÍDUOS SÓLIDOS', 14, true)
    this.addText('2.1. FONTES GERADORAS E TIPOS DE RESÍDUOS')

    data.sources.forEach((source, index) => {
      this.addTitle(`2.1.${index + 1}. ${source.source_name}`, 12, true)
      this.addText(`Tipo de Fonte: ${source.source_type}`)
      this.addText(`Localização: ${source.location}`)
      this.addText(`Descrição: ${source.description}`)
      this.addSpace(5)

      if (source.waste_types.length > 0) {
        this.addText('Tipos de Resíduos Gerados:', 11, this.margins.left)
        
        const headers = ['Resíduo', 'Classe', 'Código IBAMA', 'Qtd/Mês', 'Unidade']
        const tableData = source.waste_types.map(wt => [
          wt.waste_name,
          wt.hazard_class,
          wt.ibama_code,
          wt.estimated_quantity_monthly.toString(),
          wt.unit
        ])
        
        this.addTable(headers, tableData)
      }
      this.addSpace(10)
    })

    this.addPageBreak()

    // 3. Procedimentos Operacionais
    this.addTitle('3. PROCEDIMENTOS OPERACIONAIS', 14, true)
    
    data.procedures.forEach((procedure, index) => {
      this.addTitle(`3.${index + 1}. ${procedure.title}`, 12, true)
      this.addText(`Tipo: ${procedure.procedure_type}`)
      this.addText(`Descrição: ${procedure.description}`)
      this.addText(`Infraestrutura: ${procedure.infrastructure_details}`)
      this.addText(`Responsável: ${procedure.responsible_role}`)
      this.addText(`Frequência: ${procedure.frequency}`)
      this.addSpace(10)
    })

    this.addPageBreak()

    // 4. Metas e Objetivos
    this.addTitle('4. METAS DE REDUÇÃO E MELHORIA', 14, true)
    
    data.goals.forEach((goal, index) => {
      this.addTitle(`4.${index + 1}. ${goal.goal_type}`, 12, true)
      this.addText(`Valor Baseline: ${goal.baseline_value} ${goal.unit}`)
      this.addText(`Meta: ${goal.target_value} ${goal.unit}`)
      this.addText(`Prazo: ${goal.deadline}`)
      this.addSpace(10)
    })

    this.addPageBreak()

    // 5. Cronograma (placeholder)
    this.addTitle('5. CRONOGRAMA DE IMPLEMENTAÇÃO', 14, true)
    this.addText('As ações definidas neste plano deverão ser implementadas conforme cronograma estabelecido, considerando:')
    this.addText('• Treinamento de equipes')
    this.addText('• Adequação de infraestrutura')
    this.addText('• Implementação de procedimentos')
    this.addText('• Monitoramento e avaliação')

    this.addSpace(20)

    // 6. Responsabilidades
    this.addTitle('6. RESPONSABILIDADES', 14, true)
    this.addText(`Responsável Técnico: ${data.company.responsible_name}`)
    this.addText('Responsabilidades gerais conforme definido nos procedimentos operacionais.')

    this.addSpace(20)

    // 7. Monitoramento
    this.addTitle('7. MONITORAMENTO E INDICADORES', 14, true)
    this.addText('O monitoramento será realizado através de:')
    this.addText('• Acompanhamento das metas estabelecidas')
    this.addText('• Registros de movimentação de resíduos')
    this.addText('• Relatórios periódicos de desempenho')
    this.addText('• Auditorias internas')

    // Assinatura
    this.addSpace(30)
    this.addText('_' + '_'.repeat(40))
    this.addText(`${data.company.responsible_name}`)
    this.addText(`${data.company.responsible_title}`)
    if (data.company.art_number) {
      this.addText(`ART Nº ${data.company.art_number}`)
    }

    return this.doc.output('datauristring')
  }

  downloadPDF(data: PGRSDocumentData, filename?: string) {
    this.generateDocument(data)
    const fileName = filename || `PGRS_${data.company.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    this.doc.save(fileName)
  }
}

export const generatePGRSDocument = (data: PGRSDocumentData) => {
  const generator = new PGRSDocumentGenerator()
  return generator.generateDocument(data)
}

export const downloadPGRSDocument = (data: PGRSDocumentData, filename?: string) => {
  const generator = new PGRSDocumentGenerator()
  generator.downloadPDF(data, filename)
}