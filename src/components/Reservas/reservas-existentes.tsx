
import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useAgendamentos } from "@/provider/agendamentos"
import { ModalReservar } from "./ModalReservar"
import { ModalMinhasReservas } from "./ModalMinhasReservas"
import { Car } from 'lucide-react';

export const Reservas = () => {
    const { modalReservar, selectedDate, modalMinhasReservas } = useAgendamentos()
    const [result, setResult] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const consulta = `
        SELECT
        ID_RESERVA,
        VEICULO, 
        VEI.PLACA,
        VEI.AD_MARCA,
        RV.STATUS,
        CONVERT(VARCHAR(5), RV.DH_SAIDA, 108) AS HORA_SAIDA_FORMAT,
        CONVERT(VARCHAR(5), RV.DH_CHEGADA, 108) AS HORA_CHEGADA_FORMAT,
        CONVERT(VARCHAR(10), RV.DH_SAIDA, 103) AS DATA_SAIDA_FORMAT,
        CONVERT(VARCHAR(10), RV.DH_CHEGADA, 103) AS DATA_CHEGADA_FORMAT
        FROM SANKHYA.AD_RESERVACARROS AS RV
        INNER JOIN SANKHYA.TGFVEI VEI ON VEI.CODVEICULO = RV.VEICULO
        WHERE 
        RV.STATUS NOT IN ('C', 'N')
        AND CONVERT(DATE, RV.DH_SAIDA, 103) = '${selectedDate}'    
        `
        JX.consultar(consulta)
            .then((data: any) => {
                setResult(data);
                setLoading(false);
            }).catch((error: any) => {
                console.error(error);
                setLoading(false);
            })
    }, [selectedDate])

    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1 font-semibold text-slate-700">
                                        RESERVAS DO DIA <span className="text-green-700">{selectedDate}</span>
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        {loading ? (
                            <div className="flex justify-center items-center text-center">
                                <p className="text-center text-gray-600 text-sm">Carregando...</p>
                            </div>
                        ) : result.length === 0 ? (
                            <div className="flex justify-center items-center text-center">
                                <p className="text-center text-gray-600 text-sm">Não existe agendamentos para este dia.</p>
                            </div>
                        ) : (
                            <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {result.map((reserva: any) => (
                                    <div
                                        key={reserva.ID_RESERVA}
                                        className="flex flex-col items-center rounded-xl bg-white shadow-lg p-6 border border-gray-200 hover:shadow-2xl transition-shadow duration-300"
                                    >
                                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white mb-4">
                                            <Car />
                                        </div>

                                        <h1 className="text-2xl font-semibold text-gray-800">{reserva.PLACA}</h1>

                                        <p className="text-lg font-medium text-gray-500 mt-1 uppercase">
                                            {reserva?.AD_MARCA ? reserva.AD_MARCA : "Marca não especificada"}
                                        </p>

                                        <p
                                            className={`mt-4 px-3 py-1 rounded-full text-sm font-semibold ${reserva.STATUS === "R"
                                                    ? "bg-green-100 text-green-700"
                                                    : reserva.STATUS === "PR"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {reserva.STATUS === "R" ? "Reservado" : "Pré Reservado"}
                                        </p>

                                        <div className="mt-4 text-center text-sm text-gray-600">
                                            <p>
                                                <span className="font-medium text-gray-800">
                                                    {reserva.HORA_SAIDA_FORMAT}
                                                </span>{" "}
                                                -{" "}
                                                <span className="font-medium text-gray-800">
                                                    {reserva.HORA_CHEGADA_FORMAT}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        )}
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {modalReservar && (
                <ModalReservar />
            )}

            {modalMinhasReservas && (
                <ModalMinhasReservas />
            )}
        </>


    );
}