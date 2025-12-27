import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateGameDto {
  @IsDateString()
  startsAt!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;
}
