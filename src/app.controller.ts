import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import {
  AutenticarResponse,
  BuscarPorLoginResponse,
  HealthResponse,
} from './app.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('LDAP')
@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Saúde dos servidores LDAP' })
  @ApiResponse({ status: 200 })
  @Get('health')
  async health(): Promise<HealthResponse> {
    return await this.appService.health();
  }

  @ApiOperation({ summary: 'Autenticar usuário via LDAP' })
  @ApiResponse({ status: 200 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        login: { type: 'string', description: 'Login do usuário' },
        senha: { type: 'string', description: 'Senha do usuário' },
      },
      required: ['login', 'senha'],
      additionalProperties: false,
    },
  })
  @HttpCode(200)
  @Post('ldap/autenticar')
  async autenticar(
    @Body('login') login: string,
    @Body('senha') senha: string,
  ): Promise<AutenticarResponse> {
    return await this.appService.autenticar(login, senha);
  }

  @ApiOperation({ summary: 'Buscar usuário por login' })
  @ApiResponse({ status: 200 })
  @Get('ldap/buscar-por-login/:login')
  async buscarPorLogin(
    @Param('login') login: string,
    @Query('secretarias') secretarias: string = 'SMUL',
  ): Promise<BuscarPorLoginResponse> {
    return await this.appService.buscarPorLogin(login, secretarias);
  }
}
