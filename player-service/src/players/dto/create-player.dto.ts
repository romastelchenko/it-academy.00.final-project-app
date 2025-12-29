import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  nickname!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsInt()
  @Min(1)
  shirtNumber!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  rating!: number;

  @IsString()
  @IsOptional()
  positionOnField?: string;
}
