import { Type } from "class-transformer";
import { IsOptional, IsString, IsUrl, Length, Matches, ValidateNested } from "class-validator";
import { UserPreferencesDto } from "../../users/dto/user-preferences.dto.js";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,30}$/, {
    message: "phone must be a valid phone number",
  })
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;
}
