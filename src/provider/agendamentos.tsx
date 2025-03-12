import React, { createContext, useContext, useState, ReactNode } from 'react';
import { formatDate } from '@/lib/formataData';
// Definição dos tipos
interface AgendamentosContextProps {
    selectedDate: string | undefined;
    setSelectedDate: (date: string | undefined) => void;
    modalReservar: boolean;
    openModal: () => void;
    closeModal: () => void;
    modalMinhasReservas: boolean;
    openModalMinhasReservas: () => void;
    closeModalMinhasReservas: () => void;
}

interface AgendamentosProviderProps {
    children: ReactNode;
}

const AgendamentosContext = createContext<AgendamentosContextProps | undefined>(undefined);

export const AgendamentosProvider: React.FC<AgendamentosProviderProps> = ({ children }) => {
    const [selectedDate, setSelectedDate] = useState<string | undefined>(formatDate(new Date()));
    const [modalReservar, setModalReservar] = useState(false);
    const [modalMinhasReservas, setModalMinhasReservas] = useState(false);


    const openModal = () => {
        setModalReservar(true);
    }

    const closeModal = () => {
        setModalReservar(false);
    }


    const openModalMinhasReservas = () => {
        setModalMinhasReservas(true);
    }

    const closeModalMinhasReservas = () => {
        setModalMinhasReservas(false);
    }

    return (
        <AgendamentosContext.Provider value={{ selectedDate, setSelectedDate, modalReservar, openModal, closeModal, modalMinhasReservas, openModalMinhasReservas, closeModalMinhasReservas }}>
            {children}
        </AgendamentosContext.Provider>
    );
};

export const useAgendamentos = (): AgendamentosContextProps => {
    const context = useContext(AgendamentosContext);
    if (!context) {
        throw new Error('useAgendamentos must be used within an AgendamentosProvider');
    }
    return context;
};
