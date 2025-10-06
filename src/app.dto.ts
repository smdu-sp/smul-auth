export type BuscarPorLoginResponse = {
    login: string;
    email?: string;
    nome?: string;
    telefone?: string;
}

export type HealthResponse = {
    status: string;
    totalServers: number;
    okServers: { server: string; status: string; }[];
    errorServers: { server: string; status: string; }[];
}

export type AutenticarResponse = {
    status: string;
    message: string;
}
