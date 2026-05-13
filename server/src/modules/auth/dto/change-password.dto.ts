import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, {
    message: "newPassword must contain at least one letter",
  })
  @Matches(/\d/, { message: "newPassword must contain at least one number" })
  newPassword: string;
}
