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
    const fpMatch = text.match(/FP:\s*([\d.,]+)/i);
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

    // Convert Freezing Point (crioscopia): 53.00 -> -0.530
    let crioscopia = '';
    if (fpRaw) {
        const fpNum = parseFloat(fpRaw);
        if (!isNaN(fpNum)) {
            crioscopia = (-fpNum / 100).toFixed(3);
        }
    }

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
    private buffer: string = '';
    private onDataParsed: (data: EkomilkData) => void;

    constructor(onDataParsed: (data: EkomilkData) => void) {
        this.onDataParsed = onDataParsed;
    }

    public append(chunk: string) {
        this.buffer += chunk;
        this.processBuffer();
    }

    private processBuffer() {
        let startIndex = -1;
        const keywords = ['VENDOR', 'NUMBER', 'DATE:', 'FAT:', 'F: '];
        const upperBuf = this.buffer.toUpperCase();
        for (const kw of keywords) {
            const idx = upperBuf.indexOf(kw);
            if (idx !== -1 && (startIndex === -1 || idx < startIndex)) {
                startIndex = idx;
            }
        }

        if (startIndex === -1) {
            if (this.buffer.length > 300) {
                this.buffer = this.buffer.slice(-20);
            }
            return;
        }

        if (startIndex > 0) {
            this.buffer = this.buffer.slice(startIndex);
        }

        const hasEnd = /LAC:\s*[\d.,]+/i.test(this.buffer) || /L:\s*[\d.,]+/i.test(this.buffer);
        if (hasEnd) {
            const lines = this.buffer.split(/\r?\n/);
            let endIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (/(?:LAC|L):\s*[\d.,]+/i.test(lines[i])) {
                    endIndex = i;
                    break;
                }
            }

            if (endIndex !== -1) {
                const reportLines = lines.slice(0, endIndex + 1);
                const reportText = reportLines.join('\n');

                const parsed = parseEkomilkData(reportText);
                if (parsed && parsed.vendorId !== undefined) {
                    this.onDataParsed(parsed as EkomilkData);
                }

                const remainingLines = lines.slice(endIndex + 1);
                this.buffer = remainingLines.join('\n');
            }
        }
    }

    public clear() {
        this.buffer = '';
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
        const textDecoder = new TextDecoder();
        while (this.port && this.port.readable && this.keepReading) {
            try {
                this.reader = this.port.readable.getReader();
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        const chunk = textDecoder.decode(value);
                        this.receiver.append(chunk);
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
