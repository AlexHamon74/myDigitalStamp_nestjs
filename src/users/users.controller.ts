import { Controller, Get, Req, UseGuards, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { AuthGuard } from '@nestjs/passport';
import { UUID } from 'crypto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

@UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req): Promise<User[]> {
    return this.usersService.findAll(req.user);
  }

@UseGuards(AuthGuard('jwt'))
@Delete(':id')
async remove(@Param('id') id: UUID): Promise<void> {
  return this.usersService.remove(id);
}
}
