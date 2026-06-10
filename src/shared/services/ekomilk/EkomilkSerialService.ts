export interface EkomilkData {
    vendorId: number;
    gordura: string;
    esd: string;
    densidade: string;
    crioscopia: string;
    proteina: string;
    lactose: string;
    est: string;
}

export function parseEkomilkData(text: string): Partial<EkomilkData> | null {
    const vendorMatch = text.match(/(?:VENDOR|NUMBER)\s*[:]?\s*(\d+)/i);
    const fatMatch = text.match(/(?:FAT|F):\s*([\d.,]+)/i);
    const snfMatch = text.match(/(?:SNF|S):\s*([\d.,]+)/i);
    const denMatch = text.match(/(?:DEN|D):\s*([\d.,]+)/i);
    const fpMatch = text.match(/FP:\s*(-?[\d.,]+)/i);
    const protMatch = text.match(/(?:PROT|P):\s*([\d.,]+)/i);
    const lacMatch = text.match(/(?:LAC|L):\s*([\d.,]+)/i);

    // Verifica se conseguimos ler as métricas principais para assegurar que é um ticket Ekomilk válido
    if (!fatMatch && !snfMatch && !denMatch) return null;

    const vendorId = vendorMatch ? parseInt(vendorMatch[1], 10) : 1;
    const gordura = fatMatch ? fatMatch[1].replace(',', '.') : '';
    const esd = snfMatch ? snfMatch[1].replace(',', '.') : '';
    const denRaw = denMatch ? denMatch[1].replace(',', '.') : '';
    const fpRaw = fpMatch ? fpMatch[1].replace(',', '.') : '';
    const proteina = protMatch ? protMatch[1].replace(',', '.') : '';
    const lactose = lacMatch ? lacMatch[1].replace(',', '.') : '';

    // Convert Density: 27.68 -> 1027.7
    let densidade = '';
    if (denRaw) {
        const denNum = parseFloat(denRaw);
        if (!isNaN(denNum)) {
            densidade = (1000 + denNum).toFixed(1);
        }
    }

    // Crioscopia enviada pelo Ekomilk é ignorada a pedido do usuário (para cadastro manual)
    let crioscopia = '';

    // Calculate EST: gordura + ESD
    let est = '';
    if (gordura && esd) {
        const fatNum = parseFloat(gordura);
        const snfNum = parseFloat(esd);
        if (!isNaN(fatNum) && !isNaN(snfNum)) {
            est = (fatNum + snfNum).toFixed(2);
        }
    }

    return {
        vendorId,
        gordura,
        esd,
        densidade,
        crioscopia,
        proteina,
        lactose,
        est
    };
}

export class EkomilkSerialReceiver {
    private byteBuffer: number[] = [];
    private idleTimeout: any = null;
    private onDataParsed: (data: EkomilkData) => void;

    constructor(onDataParsed: (data: EkomilkData) => void) {
        this.onDataParsed = onDataParsed;
    }

    public append(chunk: Uint8Array) {
        // Acumula os bytes recebidos
        for (let i = 0; i < chunk.length; i++) {
            this.byteBuffer.push(chunk[i]);
        }

        // Aguarda um pequeno intervalo (150ms) de inatividade para garantir que o pacote foi totalmente recebido
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
        }

        this.idleTimeout = setTimeout(() => {
            this.processBuffer();
        }, 150);
    }

    private processBuffer() {
        if (this.byteBuffer.length === 0) return;

        const len = this.byteBuffer.length;
        const firstByte = this.byteBuffer[0];

        // Verifica se parece um bilhete de texto (caractere imprimível ASCII, ex: VENDOR, NUMBER, DATE, FAT)
        // Os caracteres ASCII imprimíveis comuns para início de bilhete estão entre 32 e 126.
        const isText = (firstByte >= 32 && firstByte <= 126) && 
                       (firstByte === 86 || firstByte === 78 || firstByte === 68 || firstByte === 70 || firstByte === 83); // V, N, D, F, S

        if (isText || len > 40) {
            // Processa como Texto (Bilhete ASCII de Impressora)
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(new Uint8Array(this.byteBuffer));
            const parsed = parseEkomilkData(text);
            if (parsed) {
                this.onDataParsed(parsed as EkomilkData);
            }
        } else if (len === 12 || len === 18 || len === 20) {
            // Processa como Binário (Modo PC)
            try {
                const readFloat = (b0: number, b1: number): string => {
                    // O formato binário da Ekomilk codifica o float em representação BCD hexadecimal,
                    // ex: 0x03 e 0x50 viram "3" e "50", resultando em 3.50.
                    const integerPart = parseInt(b0.toString(16), 10);
                    const decimalPart = parseInt(b1.toString(16), 10) / 100;
                    const val = integerPart + decimalPart;
                    return isNaN(val) ? '' : val.toFixed(2);
                };

                const fat = readFloat(this.byteBuffer[0], this.byteBuffer[1]);
                const snf = readFloat(this.byteBuffer[2], this.byteBuffer[3]);
                const denRaw = readFloat(this.byteBuffer[4], this.byteBuffer[5]);
                const fpRaw = readFloat(this.byteBuffer[8], this.byteBuffer[9]);
                const prot = readFloat(this.byteBuffer[10], this.byteBuffer[11]);
                let lac = '';

                if (len === 20) {
                    lac = readFloat(this.byteBuffer[18], this.byteBuffer[19]);
                }

                // Conversão de Densidade (ex: 27.68 -> 1027.7)
                let densidade = '';
                if (denRaw) {
                    const denNum = parseFloat(denRaw);
                    if (!isNaN(denNum)) {
                        densidade = (1000 + denNum).toFixed(1);
                    }
                }

                // Crioscopia enviada pelo Ekomilk é ignorada a pedido do usuário (para cadastro manual)
                let crioscopia = '';

                // Cálculo de EST
                let est = '';
                if (fat && snf) {
                    const fatNum = parseFloat(fat);
                    const snfNum = parseFloat(snf);
                    if (!isNaN(fatNum) && !isNaN(snfNum)) {
                        est = (fatNum + snfNum).toFixed(2);
                    }
                }

                this.onDataParsed({
                    vendorId: 1,
                    gordura: fat,
                    esd: snf,
                    densidade,
                    crioscopia,
                    proteina: prot,
                    lactose: lac,
                    est
                });
            } catch (err) {
                console.error('Erro ao processar pacote binário da Ekomilk:', err);
            }
        } else {
            console.warn(`Tamanho de pacote serial Ekomilk não reconhecido: ${len} bytes.`);
        }

        // Limpa o buffer após o processamento
        this.clear();
    }

    public clear() {
        this.byteBuffer = [];
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }
    }
}

export class EkomilkSerialService {
    private port: any = null;
    private reader: any = null;
    private keepReading: boolean = false;
    private receiver: EkomilkSerialReceiver;
    private onData: (data: EkomilkData) => void;
    private onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;

    constructor(
        onData: (data: EkomilkData) => void,
        onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
    ) {
        this.onData = onData;
        this.onStatusChange = onStatusChange;
        this.receiver = new EkomilkSerialReceiver(this.onData);
    }

    public async connect(baudRate: number = 2400, profile: '8N1' | '7E1' | '8E1' = '8N1'): Promise<void> {
        if (!('serial' in navigator)) {
            this.onStatusChange('error');
            throw new Error('Web Serial API não é suportada neste navegador.');
        }

        const dataBits = profile === '7E1' ? 7 : 8;
        const parity = (profile === '7E1' || profile === '8E1') ? 'even' : 'none';

        try {
            this.onStatusChange('connecting');
            this.port = await (navigator as any).serial.requestPort();
            await this.port.open({ 
                baudRate,
                dataBits,
                stopBits: 1,
                parity,
                flowControl: 'none'
            });

            try {
                if (this.port.setSignals) {
                    // Para perfis com paridade Even (7E1, 8E1), desabilitamos DTR/RTS para alinhar com o software original (DtrEnable/RtsEnable = False)
                    const dtrRts = (profile === '8N1') ? true : false;
                    await this.port.setSignals({ dataTerminalReady: dtrRts, requestToSend: dtrRts });
                }
            } catch (sigError) {
                console.warn('Não foi possível definir sinais DTR/RTS:', sigError);
            }

            this.onStatusChange('connected');
            this.keepReading = true;
            this.readLoop();
        } catch (error) {
            console.error('Erro ao conectar à porta serial:', error);
            this.onStatusChange('error');
            this.port = null;
            throw error;
        }
    }

    private async readLoop(): Promise<void> {
        while (this.port && this.port.readable && this.keepReading) {
            try {
                this.reader = this.port.readable.getReader();
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        this.receiver.append(value);
                    }
                }
            } catch (error) {
                console.error('Erro de leitura na porta serial:', error);
                // Aguarda 1 segundo antes de tentar ler novamente para evitar sobrecarga de CPU/Console em caso de erro persistente
                await new Promise(resolve => setTimeout(resolve, 1000));
                break;
            } finally {
                if (this.reader) {
                    try {
                        this.reader.releaseLock();
                    } catch (e) {
                        // ignore lock release error if already released
                    }
                    this.reader = null;
                }
            }
        }

        if (this.keepReading) {
            this.disconnect();
        }
    }

    public async disconnect(): Promise<void> {
        this.keepReading = false;

        if (this.reader) {
            try {
                await this.reader.cancel();
            } catch (e) {
                console.error(e);
            }
        }

        if (this.port) {
            try {
                await this.port.close();
            } catch (e) {
                console.error(e);
            }
            this.port = null;
        }

        this.receiver.clear();
        this.onStatusChange('disconnected');
    }
}
