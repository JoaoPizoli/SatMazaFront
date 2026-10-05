"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, FileChartColumn, History, Users } from "lucide-react"
import { PageTemplate } from "@/components/page-template"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RelatorioTab } from "@/components/relatorio/relatorio-tab"
import { RelatorioDestinatariosTab } from "@/components/relatorio/relatorio-destinatarios-tab"
import { RelatorioAgendamentoTab } from "@/components/relatorio/relatorio-agendamento-tab"
import { RelatorioHistoricoTab } from "@/components/relatorio/relatorio-historico-tab"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types"

export default function RelatoriosPage() {
    const { user } = useAuth()
    const router = useRouter()

    // Tela exclusiva do ADMIN (o backend também restringe todos os endpoints)
    useEffect(() => {
        if (user && user.tipo !== UserRole.ADMIN) {
            router.replace("/dashboard")
        }
    }, [user, router])

    if (!user || user.tipo !== UserRole.ADMIN) return null

    return <RelatoriosConteudo userEmail={user.email} />
}

function RelatoriosConteudo({ userEmail }: { userEmail: string | null }) {
    const [aba, setAba] = useState("relatorio")

    return (
        <PageTemplate
            title="Relatório de SATs"
            description="Indicadores do período, envio por e-mail e envio automático mensal"
        >
            <Tabs value={aba} onValueChange={setAba}>
                <TabsList className="h-auto flex-wrap">
                    <TabsTrigger value="relatorio">
                        <FileChartColumn />
                        Relatório
                    </TabsTrigger>
                    <TabsTrigger value="destinatarios">
                        <Users />
                        Destinatários
                    </TabsTrigger>
                    <TabsTrigger value="agendamento">
                        <CalendarClock />
                        Envio automático
                    </TabsTrigger>
                    <TabsTrigger value="historico">
                        <History />
                        Histórico
                    </TabsTrigger>
                </TabsList>

                {/* Sempre montada: mantém o período escolhido e os dados ao trocar de aba */}
                <TabsContent value="relatorio" forceMount className="mt-4 data-[state=inactive]:hidden">
                    <RelatorioTab userEmail={userEmail} />
                </TabsContent>
                {/* As demais abas recarregam os dados sempre que são abertas */}
                <TabsContent value="destinatarios" className="mt-4">
                    <RelatorioDestinatariosTab />
                </TabsContent>
                <TabsContent value="agendamento" className="mt-4">
                    <RelatorioAgendamentoTab />
                </TabsContent>
                <TabsContent value="historico" className="mt-4">
                    <RelatorioHistoricoTab />
                </TabsContent>
            </Tabs>
        </PageTemplate>
    )
}
