import { IsEmail, IsString, Length, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, { message: "password must contain at least one letter" })
  @Matches(/\d/, { message: "password must contain at least one number" })
  password: string;
}
