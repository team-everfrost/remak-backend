import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signupLocal() {
    return 'This action signs up a new user';
  }
  loginLocal() {
    return 'This action logs in a user';
  }

  logout() {
    return 'This action logs out a user';
  }
  refreshTokens() {
    return "This action refreshes a user's tokens";
  }
}
