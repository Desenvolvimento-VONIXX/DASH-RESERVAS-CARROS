import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { useAgendamentos } from "@/provider/agendamentos";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { format } from "date-fns";

export function DatePicker() {
  const { setSelectedDate } = useAgendamentos();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "dd/MM/yyyy");
      setSelectedDate(formattedDate);
    } else {
      setSelectedDate(undefined);
    }
  };

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar
          locale={ptBR}
          onDayClick={handleDateSelect}
          className="custom-calendar"
        />
      </SidebarGroupContent>
    </SidebarGroup>

  );
}
