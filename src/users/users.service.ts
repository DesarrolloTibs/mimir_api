import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';


import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async onModuleInit() {
    const adminExists = await this.userRepository.findOne({ where: { email: 'hector.esparza@tibs.com.mx' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin2026!', 10);
      await this.userRepository.save({
        fullName: 'Hector Esparza',
        password: hashedPassword,
        email: 'hector.esparza@tibs.com.mx',
        role: Role.Admin,
        isActive: true,
      });
    }
  }

  async findOneByEmail(email: string): Promise<User> {
    console.log('Searching for user by email:', email);
    const user = await this.userRepository.findOne({ where: { email, isActive: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id, isActive: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(userData: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    // Primero, asegúrate de que el usuario exista para evitar errores en la actualización.
    const userToUpdate = await this.userRepository.findOne({ where: { id } });
    if (!userToUpdate) throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);

    await this.userRepository.update(id, updateUserDto);

    // Merge and return the updated user
    Object.assign(userToUpdate, updateUserDto);
    return userToUpdate;
  }

  async updateStatus(id: string, updateUserStatusDto: UpdateUserStatusDto): Promise<User> {
    const userToUpdate = await this.userRepository.findOne({ where: { id } });
    if (!userToUpdate) throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);

    await this.userRepository.update(id, { isActive: updateUserStatusDto.isActive });

    // Merge and return the updated user
    userToUpdate.isActive = updateUserStatusDto.isActive;
    return userToUpdate;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.update(id, { isActive: false });
  }
}