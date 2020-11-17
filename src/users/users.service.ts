import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // create user & hash the password
    try {
      // check new user
      const exist = await this.users.findOne({ email });
      if (exist) {
        // make error message
        return {
          ok: false,
          error: `There is a user with that email ${email} already`,
        };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      // make error message
      return { ok: false, error: `Couldn't create account` };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // find the user with emai
    const user = await this.users.findOne({ email });
    if (!user) {
      return {
        ok: false,
        error: `User  not found`,
      };
    }
    // check of the password is correct
    const passwordCorrect = await user.checkPassword(password);
    if (!passwordCorrect) {
      return {
        ok: false,
        error: 'wrong password',
      };
    }
    return {
      ok: true,
      token: 'tokentoken',
    };
    // make a JWT and give it to the user
    try {
    } catch (e) {
      return { ok: false, error: e };
    }
  }
}
