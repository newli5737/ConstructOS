import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Response,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Đăng nhập vào hệ thống (Thiết lập HttpOnly Cookie bảo mật)' })
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
    const result = await this.authService.login(user);

    // Set secure HttpOnly cookie (strict security against XSS)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT === '3000';
    res.cookie('jwt', result.accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS in production
      sameSite: isProduction ? 'none' : 'lax', // Support cross-subdomain API calls
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      success: true,
      user: result.user,
      accessToken: result.accessToken, // Still provided for Swagger and CLI tools
      message: 'Đăng nhập thành công',
    };
  }

  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại qua HttpOnly Cookie' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @ApiOperation({ summary: 'Đăng xuất và hủy HttpOnly Cookie' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: ExpressResponse) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT === '3000';
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
    return { success: true, message: 'Đăng xuất thành công' };
  }
}
