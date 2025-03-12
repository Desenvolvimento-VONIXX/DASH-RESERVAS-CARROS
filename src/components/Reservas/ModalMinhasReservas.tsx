
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog";
import { useAgendamentos } from "@/provider/agendamentos";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
export const ModalMinhasReservas = () => {
    const { modalMinhasReservas, closeModalMinhasReservas } = useAgendamentos();
    const [loading, setLoading] = useState(false);
    const [reservas, setReservas] = useState([]);
    const { toast } = useToast()

    useEffect(() => {
        setLoading(true);
        JX.consultar(`
            SELECT 
            RV.*,
            CONVERT(VARCHAR(10), RV.DH_CHEGADA, 103) + ' ' + CONVERT(VARCHAR(5), RV.DH_CHEGADA, 108) AS DH_CHEGADA_FORMAT,
            CONVERT(VARCHAR(10), RV.DH_SAIDA, 103) + ' ' + CONVERT(VARCHAR(5), RV.DH_SAIDA, 108) AS DH_SAIDA_FORMAT, 
            VEI.PLACA,
            VEI.AD_MARCA
            FROM SANKHYA.AD_RESERVACARROS AS RV
            INNER JOIN SANKHYA.TGFVEI VEI ON VEI.CODVEICULO =  RV.VEICULO 
            WHERE 
            CODUSU = SANKHYA.STP_GET_CODUSULOGADO()   
            AND RV.STATUS NOT IN ('C')
            AND RV.DH_SAIDA >= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0) 
            AND YEAR(RV.DH_SAIDA) = YEAR(GETDATE()) 
            ORDER BY
            CASE WHEN RV.DH_SAIDA >= GETDATE() THEN RV.DH_SAIDA END, 
            RV.DH_SAIDA DESC 
        `).then((data: any) => {
            setReservas(data);
            setLoading(false);
        }).catch((error: any) => {
            console.error(error);
            setLoading(false);

        })
    }, [])

    const handleCancelarReserva = async (reservaId: number) => {
        try {
            const response = await
                JX.novoSalvar(
                    {
                        STATUS: 'C'
                    },
                    "AD_RESERVACARROS",
                    { ID_RESERVA: reservaId }

                )
            if (response.status == "1") {
                toast({
                    className: "bg-green-800 border-green-800 text-white",
                    title: "Sucesso ao cancelar a reserva!",
                    description: "Sua reserva foi cancelada! Para fazer um novo agendamento basta ir em 'Fazer Reserva' no menu.",
                })

                closeModalMinhasReservas();
                setTimeout(() => {
                    window.location.reload();
                }, 4000);
            }
            else {
                toast({
                    variant: "destructive",
                    title: "Erro ao cancelar a reserva",
                    description: `Tente novamente mais tarde. Detalhes do erro: ${response.statusMessage}`,

                })
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Ocorreu um erro",
                description: `Erro ao cancelar a reserva: ${error.message || error}`,
            })
            alert(`Erro ao cancelar a reserva: ${error.message || error}`);
        }
    }




    return (
        <>
            <Dialog open={modalMinhasReservas} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    closeModalMinhasReservas();
                }
            }}>
                <DialogContent className="sm:max-w-[50%]">
                    <DialogHeader>
                        <h1 className="font-semibold text-lg text-slate-700">MINHAS RESERVAS</h1>
                    </DialogHeader>
                    <div className="grid auto-rows-min gap-2  max-h-[70vh] overflow-auto">
                        {loading ? (
                            <p className="text-center text-gray-600 text-sm">Carregando...</p>

                        ) : reservas.length === 0 ? (
                            <p className="text-center text-gray-600 text-sm">Você não possui nenhuma reserva.</p>
                        ) : (
                            reservas.map((reserva: any) => (
                                <div
                                    key={reserva.ID_RESERVA}
                                    className={`flex justify-between p-6 mb-4 text-sm rounded-xl shadow-md transition-shadow duration-300 
                                    ${reserva.STATUS === 'R'
                                            ? 'bg-green-100 hover:shadow-lg'
                                            : reserva.STATUS === 'PR'
                                                ? 'bg-yellow-100 hover:shadow-lg'
                                                : reserva.STATUS === 'N'
                                                    ? 'bg-red-100 hover:shadow-lg'
                                                    : 'bg-gray-100'
                                        }`}
                                >
                                    <div className="gap-4 w-full">
                                        <h1 className="font-semibold text-xl text-gray-800 uppercase">{reserva.PLACA.trim()} {reserva?.AD_MARCA ? `- ${reserva.AD_MARCA}` : "Marca não especificada"} </h1>
                                        <p className="text-md text-gray-600">
                                            Id: <span className="font-medium text-gray-700">{reserva.ID_RESERVA}</span>
                                        </p>
                                        <p className="text-md text-gray-600">
                                            Saída: <span className="font-medium text-gray-700">{reserva.DH_SAIDA_FORMAT}</span>
                                        </p>
                                        <p className="text-md text-gray-600">
                                            Chegada: <span className="font-medium text-gray-700">{reserva.DH_CHEGADA_FORMAT}</span>
                                        </p>
                                        <p className="text-md text-gray-600">
                                            Status:
                                            <span className={`font-medium pl-1 ${reserva.STATUS === 'R' ? 'text-green-700' :
                                                reserva.STATUS === 'PR' ? 'text-yellow-700' : reserva.STATUS === 'N' ? 'text-red-700' : 'text-gray-700'}`}>
                                                {reserva.STATUS === 'R' ? 'Reservado' : reserva.STATUS === 'PR' ? 'Pré Reservado' : 'Negado'}
                                            </span>
                                        </p>
                                        {reserva.MOTIVO_NEGADO && (
                                            <p className="text-md text-red-600 mt-2">
                                                Motivo Negado: <span className="font-medium">{reserva.MOTIVO_NEGADO}</span>
                                            </p>
                                        )}
                                    </div>

                                    {reserva.STATUS === 'R' || reserva.STATUS === 'PR' ? (
                                        <div className="flex flex-col items-center font-semibold">
                                            <button
                                                className="mt-3 px-4 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                                                onClick={() => handleCancelarReserva(reserva.ID_RESERVA)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        )}

                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            onClick={() => closeModalMinhasReservas()}
                            className="bg-slate-700 hover:bg-slate-700"
                        >
                            Fechar
                        </Button>

                    </DialogFooter>

                </DialogContent>
            </Dialog>
        </>
    )
}