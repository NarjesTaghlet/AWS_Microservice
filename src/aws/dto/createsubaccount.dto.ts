import { IsString, IsEmail } from 'class-validator';

export class CreateSubAccountDto {
  @IsEmail()
  userEmail: string;

  @IsString()
  userName: string;
}
