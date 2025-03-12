import './App.css'
import { AgendamentosProvider } from './provider/agendamentos'
import { Reservas } from './components/Reservas/reservas-existentes'
import { Toaster } from "@/components/ui/toaster"

function App() {

  return (
    <AgendamentosProvider>
      <Reservas />
      <Toaster />
    </AgendamentosProvider>

  )
}

export default App
