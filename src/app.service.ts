import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AutenticarResponse,
  BuscarPorLoginResponse,
  HealthResponse,
} from './app.dto';
import { Client as LdapClient } from 'ldapts';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  createLdapServer(server: string) {
    return new LdapClient({
      url: server,
    });
  }

  async health(): Promise<HealthResponse> {
    const response: HealthResponse = {
      status: 'OK',
      totalServers: 0,
      okServers: [],
      errorServers: [],
    };
    const dbServers = await this.prisma.servidor.findMany({
      select: { ip: true },
    });
    const servers = dbServers.map((s) => `ldap://${s.ip}`);
    response.totalServers = servers.length;
    for (const server of servers) {
      try {
        const ldap = this.createLdapServer(server);
        await ldap.bind(
          `${process.env.LDAP_USER}${process.env.LDAP_DOMAIN}`,
          process.env.LDAP_PASS || '',
        );
        response.okServers.push({ server, status: 'OK' });
        void ldap.unbind();
      } catch {
        response.errorServers.push({ server, status: 'ERROR' });
      }
    }
    if (response.errorServers.length > 4) response.status = 'WARNING';
    if (response.errorServers.length > 8) response.status = 'ERROR';
    return response;
  }

  async autenticar(login: string, senha: string): Promise<AutenticarResponse> {
    if (!login || login === '')
      throw new BadRequestException('Login vazio. O login é obrigatório.');
    if (!senha || senha === '')
      throw new BadRequestException('Senha vazia. A senha é obrigatória.');
    let serverNum = 0;
    void setTimeout(() => {
      throw new InternalServerErrorException({
        status: 'ERROR',
        message: 'Erro ao autenticar usuário. Verifique o status da aplicação.',
      });
    }, 10000);
    const erros: { server: string; erro: unknown }[] = [];
    const health = await this.health();
    if (health.status === 'ERROR')
      throw new InternalServerErrorException({
        message: 'Erro ao autenticar usuário. Verifique o status da aplicação.',
        health,
      });
    const servers = health.okServers.map((server) => server.server);
    do {
      const ldap = this.createLdapServer(servers[serverNum]);
      try {
        await ldap.bind(`${login}${process.env.LDAP_DOMAIN}`, senha);
        return {
          status: 'OK',
          message: 'Usuário autenticado com sucesso.',
        };
      } catch (err: unknown) {
        erros.push({ server: servers[serverNum], erro: err });
        console.log(err);
      }
      serverNum++;
    } while (serverNum < servers.length);
    throw new UnauthorizedException({
      status: 'ERROR',
      message: 'Credenciais incorretas. Verifique o login e a senha.',
      erros,
    });
  }

  async buscarPorLogin(
    login: string,
    secretarias: string,
  ): Promise<BuscarPorLoginResponse> {
    if (!login || login === '')
      throw new BadRequestException('Login vazio. O login é obrigatório.');
    let resposta: BuscarPorLoginResponse | null = null;
    let serverNum = 0;
    const erros: unknown[] = [];
    const health = await this.health();
    if (health.status === 'ERROR')
      throw new InternalServerErrorException({
        message: 'Erro ao buscar usuário. Verifique o status da aplicação.',
        health,
      });
    const servers = health.okServers.map((server) => server.server);
    do {
      const ldap = this.createLdapServer(servers[serverNum]);
      try {
        await ldap.bind(
          `${process.env.LDAP_USER}${process.env.LDAP_DOMAIN}`,
          process.env.LDAP_PASS || '',
        );
        secretarias = !secretarias || secretarias === '' ? 'SMUL' : secretarias;
        const secretariasArray = secretarias.split(',');
        let filter = '';
        secretariasArray.forEach((secretaria) => {
          filter += `(company=${secretaria})`;
        });
        const usuario = await ldap.search(process.env.LDAP_BASE || '', {
          filter: `(&(samaccountname=${login})(|${filter}))`,
          scope: 'sub',
          attributes: ['name', 'mail', 'telephoneNumber', 'samaccountname'],
        });
        if (usuario.searchEntries.length > 0) {
          const { name, mail, telephoneNumber, sAMAccountName } =
            usuario.searchEntries[0];
          const nome = name ? name.toString() : undefined;
          const email = mail ? mail.toString().toLowerCase() : undefined;
          const telefone = telephoneNumber
            ? telephoneNumber.toString().replace('55', '').replace(/\D/g, '')
            : undefined;
          login = sAMAccountName
            ? sAMAccountName.toString().toLowerCase()
            : login;
          resposta = { nome, email, login, telefone };
        } else {
          erros.push({
            server: servers[serverNum],
            error: 'Usuário não encontrado.',
          });
        }
      } catch (err: unknown) {
        erros.push({
          server: servers[serverNum],
          error: err,
        });
      }
      void ldap.unbind();
      serverNum++;
      if (resposta) break;
    } while (serverNum < servers.length);
    if (!resposta) {
      if (health.status === 'OK')
        throw new NotFoundException(
          'Usuário não encontrado. Certifique-se de que o login está correto.',
        );
      throw new InternalServerErrorException({
        message: 'Erro ao buscar usuário. Verifique o status da aplicação.',
        erros,
        health,
      });
    }
    return resposta;
  }
}
