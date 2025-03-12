import * as React from "react"
import { Plus, FileCheck } from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { useAgendamentos } from "@/provider/agendamentos"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { openModal, openModalMinhasReservas } = useAgendamentos()

  return (
    <Sidebar {...props} >
      <SidebarContent className="bg-white">
        <DatePicker />
        <SidebarSeparator className="mx-0" />
      </SidebarContent>
      <SidebarFooter className="bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openModalMinhasReservas}>
              <FileCheck />
              <span className="font-medium">Minhas Reservas</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton onClick={openModal} >
              <Plus />
              <span className="font-medium">Fazer Reserva</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
