import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { BuscarPorLoginResponse, HealthResponse } from './app.dto';
import { Client as LdapClient } from 'ldapts';

@Injectable()
export class AppService {
  readonly ldapServers = [
    "ldap://10.10.53.10",
    "ldap://10.10.53.11",
    "ldap://10.10.53.12",
    "ldap://10.10.64.213",
    "ldap://10.10.65.242",
    "ldap://10.10.65.90",
    "ldap://10.10.65.91",
    "ldap://10.10.66.85",
    "ldap://10.10.68.42",
    "ldap://10.10.68.43",
    "ldap://10.10.68.44",
    "ldap://10.10.68.45",
    "ldap://10.10.68.46",
    "ldap://10.10.68.47",
    "ldap://10.10.68.48",
    "ldap://10.10.68.49",
  ];

  createLdapServer(server: string) {
    return new LdapClient({
      url: server,
    });
  }

  async health(): Promise<HealthResponse> {
    const servers: HealthResponse = [];
    for (const server of this.ldapServers) {
      try {
        const ldap = this.createLdapServer(server);
        await ldap.bind(
          `${process.env.LDAP_USER}${process.env.LDAP_DOMAIN}`,
          process.env.LDAP_PASS || '',
        );
        servers.push({ server, status: 'OK' });
        ldap.unbind();
      } catch (err) {
        servers.push({ server, status: 'ERROR' });
      }
    }
    return servers;
  }

  async buscarPorLogin(login: string, secretarias: string): Promise<BuscarPorLoginResponse> {
    if (!login || login === '') throw new BadRequestException("Login inválido");
    let resposta: BuscarPorLoginResponse | null = null;
    let serverNum = 0;
    const erros: any[] = [];
    do {
      try {
        const ldap = this.createLdapServer(this.ldapServers[serverNum]);
        await ldap.bind(
          `${process.env.LDAP_USER}${process.env.LDAP_DOMAIN}`,
          process.env.LDAP_PASS || '',
        );
        secretarias = !secretarias || secretarias === "" ? "SMUL" : secretarias;
        const secretariasArray = secretarias.split(',');
        let filter = "";
        secretariasArray.forEach((secretaria) => {
          filter += `(company=${secretaria})`;
        });
        const usuario = await ldap.search(process.env.LDAP_BASE || '', {
          filter: `(&(samaccountname=${login})(|${filter}))`,
          scope: 'sub',
        });
        const { name, mail, telephoneNumber } = usuario.searchEntries[0];
        const nome = name ? name.toString() : undefined;
        const email = mail ? mail.toString().toLowerCase() : undefined;
        const telefone = telephoneNumber ? telephoneNumber.toString().replace('55', '').replace(/\D/g, '') : undefined;
        resposta = { nome, email, login, telefone };
        ldap.unbind();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        erros.push({
          server: this.ldapServers[serverNum],
          error: err,
        });
      }
      serverNum++;
      if (resposta) break;
    } while (serverNum < this.ldapServers.length);
    if (!resposta) throw new InternalServerErrorException("Não foi possível encontrar esse usuário.");
    return resposta;
  }
}
