import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { BuscarPorLoginResponse, HealthResponse } from './app.dto';

@Controller('')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async health(): Promise<HealthResponse> {
    return await this.appService.health();
  }

  @Get('ldap/health')
  async ldapHealth(): Promise<{ server: string, status: string }[]> {
    return await this.appService.health();
  }

  @Get('ldap/buscar-por-login/:login')
  async buscarPorLogin(
    @Param('login') login: string,
    @Query('secretarias') secretarias: string = "SMUL",
  ): Promise<BuscarPorLoginResponse> {
    return await this.appService.buscarPorLogin(login, secretarias);
  }
}
