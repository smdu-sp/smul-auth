import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AutenticarResponse, BuscarPorLoginResponse, HealthResponse } from './app.dto';

@Controller('')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async health(): Promise<HealthResponse> {
    return await this.appService.health();
  }

  @HttpCode(200)
  @Post('ldap/autenticar')
  async autenticar(
    @Body('login') login: string,
    @Body('senha') senha: string,
  ): Promise<AutenticarResponse> {
    return await this.appService.autenticar(login, senha);
  }

  @Get('ldap/buscar-por-login/:login')
  async buscarPorLogin(
    @Param('login') login: string,
    @Query('secretarias') secretarias: string = "SMUL",
  ): Promise<BuscarPorLoginResponse> {
    return await this.appService.buscarPorLogin(login, secretarias);
  }
}
