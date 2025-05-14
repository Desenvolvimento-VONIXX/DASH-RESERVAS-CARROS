import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { useAgendamentos } from "@/provider/agendamentos";
import { Button } from "../ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { parse, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export const ModalReservar = () => {
  const { modalReservar, closeModal } = useAgendamentos();
  const [listVeiculos, setListVeiculos] = useState<any[]>([]);
  const [codUsu, setCodU] = useState(null);
  const [codSetor, setCodSetor] = useState(null);
  const [codFun, setCodFun] = useState(null);
  const [nomeFun, setNomeFun] = useState(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const convertToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formSchema = z.object({
    veiculo: z.string().min(1, { message: "Selecione o Veículo" }),
    data: z.string().min(1, { message: "Selecione a Data" }),
    hora_saida: z.string().min(1, { message: "Selecione a Hora de Saida" }),
    hora_chegada: z.string().min(1, { message: "Selecione a Hora de Chegada" }),
    finalidade: z.string().min(1, { message: "Descreva a Finalidade" }),
    anexo: z.instanceof(File),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      veiculo: "",
      data: "",
      hora_saida: "",
      hora_chegada: "",
      finalidade: "",
    },
  });

  useEffect(() => {
    JX.consultar(
      "SELECT CODVEICULO, PLACA, MARCAMODELO, AD_MARCA FROM TGFVEI WHERE AD_CARROTRACT = 'S'"
    ).then((data: any) => {
      setListVeiculos(data);
    });

    JX.consultar(
      `
            SELECT 
            USU.CODGRUPO, 
            USU.CODUSU, 
            COALESCE(FCO.CODFUNCAO,0) AS CODFUNCAO, 
            COALESCE(FCO.DESCRFUNCAO,GRU.NOMEGRUPO) AS DESCRFUNCAO, 
            COALESCE(FUN.NOMEFUNC,USU.NOMEUSU) AS NOMEFUNC 
            FROM TSIUSU USU 
            LEFT JOIN TFPFUN FUN ON FUN.CPF = USU.CPF 
            LEFT JOIN TFPFCO FCO ON FCO.CODFUNCAO = FUN.CODFUNCAO AND FUN.CODEMP = USU.CODEMP 
            LEFT JOIN TSIGRU GRU ON GRU.CODGRUPO = USU.CODGRUPO 
            WHERE 
            USU.CODUSU = SANKHYA.STP_GET_CODUSULOGADO() 
        `
    )
      .then((data: any) => {
        setCodU(data[0].CODUSU);
        setCodSetor(data[0].CODGRUPO);
        setCodFun(data[0].CODFUNCAO);
        setNomeFun(data[0].NOMEFUNC);
      })
      .catch((error: any) => {
        console.error("Erro ao consultar dados do usuário", error);
      });
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { hora_saida, hora_chegada, data } = values;

    const dtAtual = new Date();
    dtAtual.setHours(0, 0, 0, 0);

    const dataInput = parse(data, "dd/MM/yyyy", new Date());
    dataInput.setHours(0, 0, 0, 0);

    if (hora_saida && hora_chegada) {
      const horaSaidaInMinutes = convertToMinutes(hora_saida);
      const horaChegadaInMinutes = convertToMinutes(hora_chegada);

      if (horaChegadaInMinutes <= horaSaidaInMinutes) {
        form.setError("hora_chegada", {
          message:
            "A Hora de Chegada não pode ser igual ou anterior à Hora de Saída",
        });
        return;
      }
    }

    if (dataInput < dtAtual) {
      form.setError("data", {
        message: "Data não pode ser anterior à data atual",
      });
      return;
    }

    const dataCompletaSaida = `${data} ${hora_saida}:00`;
    const dataCompletaChegada = `${data} ${hora_chegada}:00`;

    const dhCompletaAtual = new Date();

    const [horaSaida, minutoSaida] = hora_saida.split(":").map(Number);
    const dhCompletaSaida = parse(data, "dd/MM/yyyy", new Date());
    dhCompletaSaida.setHours(horaSaida, minutoSaida, 0, 0);

    if (dhCompletaSaida < dhCompletaAtual) {
      form.setError("hora_saida", {
        message:
          "O horário de saída não pode ser anterior ao horário atual de hoje.",
      });
      return;
    }

    const consulta = `
            SELECT 
            ID_RESERVA, 
            VEICULO, 
            DH_SAIDA, 
            DH_CHEGADA, 
            STATUS 
            FROM SANKHYA.AD_RESERVACARROS
            WHERE 
            STATUS IN ('PR', 'R')
            AND VEICULO = ${Number(values.veiculo)}
            AND (
                ('${String(dataCompletaSaida)}' > DH_SAIDA AND '${String(
      dataCompletaSaida
    )}' < DH_CHEGADA)
                OR
                ('${String(dataCompletaChegada)}' > DH_SAIDA AND '${String(
      dataCompletaChegada
    )}' < DH_CHEGADA)
                OR
                (DH_SAIDA >= '${String(
                  dataCompletaSaida
                )}' AND DH_CHEGADA <= '${String(dataCompletaChegada)}')
                OR
                (DH_SAIDA < '${String(
                  dataCompletaSaida
                )}' AND DH_CHEGADA > '${String(dataCompletaChegada)}')
            )    
        `;
    setLoading(true);

    JX.consultar(consulta).then((data: any) => {
      if (data.length > 0) {
        toast({
          variant: "destructive",
          title: "Reserva indisponível",
          description: `Já existe uma reserva para o veículo selecionado nesta data e horário. Por favor, escolha outro horário ou veículo.`,
        });
        setLoading(false);
        return;
      } else {
        salvarReserva(values, dataCompletaSaida, dataCompletaChegada);
      }
    });
  }

  const salvarReserva = async (
    values: z.infer<typeof formSchema>,
    dataCompletaSaida: string,
    dataCompletaChegada: string
  ) => {
    try {
      const response = await JX.salvar(
        {
          CODUSU: Number(codUsu),
          CODGRUPO: Number(codSetor),
          VEICULO: Number(values.veiculo),
          FINALIDADE: String(values.finalidade),
          STATUS: "PR",
          DH_SAIDA: dataCompletaSaida,
          DH_CHEGADA: dataCompletaChegada,
          FUNCAO: Number(codFun),
        },
        "AD_RESERVACARROS",
        []
      );
      if (response.status == "1") {
        const reservaId = response.responseBody.entities.entity.ID_RESERVA.$;
        toast({
          className: "bg-green-800 border-green-800 text-white",
          title: "Reserva salva com sucesso!",
          description:
            "Sua reserva foi enviada para aprovação. Aguarde enquanto processamos a solicitação.",
        });
        notificaAprovador(values, reservaId);
        anexaArquivos(values.anexo, reservaId);
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao salvar a reserva",
          description: `Não foi possível concluir o salvamento da reserva. Detalhes do erro: ${response.statusMessage}`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ocorreu um erro",
        description: `Erro ao salvar a reserva: ${error.message || error}`,
      });
      alert(`Erro ao salvar a reserva: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const anexaArquivos = async (anexos: any, reservaId: number) => {
    const formData = new FormData();
    formData.append("arquivo", anexos);
    const sessionkey = `ANEXO_SISTEMA_AD_RESERVACARROS_${new Date().getTime()}`;
    await axios.post(
      `${window.location.origin}/mge/sessionUpload.mge?sessionkey=${sessionkey}&fitem=S&salvar=S&useCache=N`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    await JX.novoSalvar(
      { ANEXOS: `$file.session.key{${sessionkey}}` },
      "AD_RESERVACARROS",
      { ID_RESERVA: reservaId }
    );

    closeModal();
    setTimeout(() => {
      window.location.reload();
    }, 4000);
  };

  const notificaAprovador = async (values: any, reservaId: number) => {
    var titulo = `Nova Solicitação de Reserva de Carro!`;
    var msg = `
        Usuário:  <strong>${nomeFun}</strong> <br> 
        Data da Reserva:  <strong>${values.data}</strong> <br>  
        Horário: <strong>${values.hora_saida} às ${values.hora_chegada}</strong> <br>  
     `;
    var link = linkSolicitacao(reservaId);

    var mensagemCompleta = `${msg} <br><br> ${link}`;
    JX.salvar(
      {
        CODUSUREMETENTE: codUsu,
        CODUSU: 936,
        TITULO: titulo,
        DESCRICAO: mensagemCompleta,
        IDENTIFICADOR: "PERSONALIZADO",
        IMPORTANCIA: 0,
        TIPO: "P",
        SOLUCAO: link,
      },
      "AvisoSistema",
      []
    )
      .then(function (response: any) {
        console.log("Dados salvos com sucesso:", response);
      })
      .catch(function (error: any) {
        console.error("Erro ao enviar a notificação:", error);
      });
  };

  function linkSolicitacao(reservaId: number) {
    const base = "#app/";
    const enderecoTela = "br.com.sankhya.menu.adicional.AD_RESERVACARROS";
    const filtroTela = `{\"ID_RESERVA\":\"${reservaId}\"}`;

    const enderecoTela64 = btoa(enderecoTela);
    const filtroTela64 = btoa(filtroTela);

    const linkCurto = `${base}${enderecoTela64}/${filtroTela64}`;

    const link = `<a href="${linkCurto}" target="_top" title="Abrir">Clique aqui para ver a solicitação!</a>`;
    return link;
  }

  return (
    <>
      <Dialog
        open={modalReservar}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[50%] ">
          <DialogHeader>
            <h1 className="font-semibold text-lg text-slate-700">
              REALIZAR PRÉ RESERVA
            </h1>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="veiculo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Veículo</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="border-2 border-blue-950 rounded px-3 py-2 text-sm">
                            <SelectValue placeholder="Selecionar Veículo">
                              {field.value ? (
                                `${
                                  listVeiculos.find(
                                    (v) => v.CODVEICULO == String(field.value)
                                  )?.PLACA
                                }`
                              ) : (
                                <span className="text-gray-500">
                                  Selecione Veículo
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-300 uppercase">
                            {listVeiculos.map((veiculo: any) => (
                              <SelectItem
                                key={veiculo.CODVEICULO}
                                value={veiculo.CODVEICULO}
                              >
                                {veiculo.PLACA}{" "}
                                {veiculo?.AD_MARCA
                                  ? `- ${veiculo.AD_MARCA}`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-2 border-blue-950 rounded px-3 py-2"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value || "Selecione a Data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-slate-200 z-[50] relative">
                            <Calendar
                              className="z-[60]"
                              locale={ptBR}
                              onDayClick={(date) => {
                                field.onChange(
                                  format(date, "dd/MM/yyyy", { locale: ptBR })
                                );
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-3 ">
                <FormField
                  control={form.control}
                  name="hora_saida"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Horário da Saída</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="time"
                            className="bg-gray-50 border-2 leading-none border-blue-950 text-gray-900 text-sm rounded block w-full p-2.5 "
                            value={field.value || "00:00"}
                            onChange={(e) => {
                              const value = e.target.value;
                              const [hours] = value.split(":");
                              field.onChange(`${hours}:00`);
                            }}
                            step="3600"
                            required
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hora_chegada"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Horário da Chegada</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="time"
                            className="bg-gray-50 border-2 leading-none border-blue-950 text-gray-900 text-sm rounded block w-full p-2.5 "
                            value={field.value || "00:00"}
                            onChange={(e) => {
                              const value = e.target.value;
                              const [hours] = value.split(":");
                              field.onChange(`${hours}:00`);
                            }}
                            step="3600"
                            required
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-3 ">
                <FormField
                  control={form.control}
                  name="finalidade"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Finalidade</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder=""
                          {...field}
                          className="border-2 border-blue-950 border-dashed rounded-lg  h-[15vh]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anexo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>
                        Inserir Anexo (NÃO INSERIR PDF APENAS ARQUIVO DE IMAGEM)
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-[15vh] border-2 border-blue-950 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg
                                className="w-8 h-8 mb-4 text-gray-500 "
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 20 16"
                              >
                                <path
                                  stroke="currentColor"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                />
                              </svg>
                              <p className="mb-2 text-sm text-gray-500 ">
                                <span className="font-semibold">
                                  Click to upload
                                </span>
                              </p>
                              <p className="text-center justify-center items-center">
                                {field.value
                                  ? `Arquivo adicionado: ${field.value.name}`
                                  : "Nenhum arquivo adicionado"}
                              </p>
                            </div>
                            <input
                              id="dropzone-file"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (!file.type.startsWith("image/")) {
                                    alert(
                                      "Apenas arquivos de imagem são permitidos."
                                    );
                                    e.target.value = "";
                                    return;
                                  }
                                  field.onChange(file);
                                } else {
                                  field.onChange(null);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  onClick={() => closeModal()}
                  className="bg-slate-700 hover:bg-slate-700"
                >
                  Fechar
                </Button>
                <Button
                  disabled={loading}
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
};
