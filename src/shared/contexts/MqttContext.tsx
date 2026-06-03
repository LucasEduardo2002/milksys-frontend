import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { MqttClient } from 'mqtt';
import { Api } from '../services/api/axios-config';
import { Environment } from '../environment';

export interface QueueItem {
    id: number;
    nome: string;
}

interface IMqttContext {
    filaEspera: QueueItem[];
    adicionarNaFila: (item: QueueItem) => void;
}

const MqttContext = createContext<IMqttContext>({} as IMqttContext);

export const useMqtt = () => useContext(MqttContext);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [filaEspera, setFilaEspera] = useState<QueueItem[]>([]);
    const filaRef = useRef<QueueItem[]>([]);
    const mqttClientRef = useRef<MqttClient | null>(null);
    const processandoRef = useRef(false);

    const processarFila = () => {
        if (!mqttClientRef.current || processandoRef.current) return;
        const proximo = filaRef.current[0];
        if (!proximo) return;

        processandoRef.current = true;
        mqttClientRef.current.publish(
            'sertao_serido/fila',
            JSON.stringify({
                comando: "AGUARDANDO_PESO",
                nome: proximo.nome,
                id: proximo.id
            }),
            { retain: true }
        );
        console.log("📤 Enviado para balança (Global):", proximo.nome);
    };

    useEffect(() => {
        let isMounted = true;
        let client: MqttClient | null = null;

        const setupMqtt = async () => {
            if (mqttClientRef.current) return;

            const { default: mqtt } = await import('mqtt');
            if (!isMounted) return;

            client = mqtt.connect(Environment.MQTT_WS_URL, {
                reconnectPeriod: 5000,
            });

            mqttClientRef.current = client;

            client.on('connect', () => {
                console.log('✅ MQTT conectado (Global)');
                client?.subscribe('sertao_serido/leite');
                processarFila();
            });

            client.on("message", async (_topic, message) => {
                const dados = JSON.parse(message.toString());
                console.log("📥 Recebido da balança (Global):", dados);

                try {
                    await Api.patch(`/coletas/${dados.id}/${dados.peso}`, {
                        leite_bom_qnt: dados.peso
                    });

                    console.log("✅ Peso atualizado para ID", dados.id);
                    filaRef.current.shift();
                    setFilaEspera([...filaRef.current]);

                    // Emitir evento customizado para notificar outras telas
                    window.dispatchEvent(new CustomEvent('mqtt-peso-atualizado', { detail: dados }));

                    processandoRef.current = false;
                    setTimeout(() => {
                        processarFila();
                    }, 2000);

                } catch (error: any) {
                    console.log("Erro ao atualizar peso:", error?.response?.data || error.message);
                    
                    // Em caso de erro, remove da fila e tenta o próximo para não travar
                    filaRef.current.shift();
                    setFilaEspera([...filaRef.current]);
                    processandoRef.current = false;
                    
                    setTimeout(() => {
                        processarFila();
                    }, 2000);
                }
            });

            client.on('error', (err) => {
                console.error("Erro MQTT (Global):", err);
            });
        };

        setupMqtt();

        return () => {
            isMounted = false;
            client?.end(true);
            if (mqttClientRef.current === client) {
                mqttClientRef.current = null;
            }
        };
    }, []);

    const adicionarNaFila = (item: QueueItem) => {
        filaRef.current.push(item);
        setFilaEspera([...filaRef.current]);
        
        // Se adicionou algo e não está processando, força processar
        if (!processandoRef.current) {
            processarFila();
        }
    };

    return (
        <MqttContext.Provider value={{ filaEspera, adicionarNaFila }}>
            {children}
        </MqttContext.Provider>
    );
};
