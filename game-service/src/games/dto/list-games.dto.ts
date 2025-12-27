import { IsDateString, IsOptional } from 'class-validator';

export class ListGamesDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
