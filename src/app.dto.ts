export type BuscarPorLoginResponse = {
    login: string;
    email?: string;
    nome?: string;
    telefone?: string;
}

export type HealthResponse = {
    server: string;
    status: string;
}[]