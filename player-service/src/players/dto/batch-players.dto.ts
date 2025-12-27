import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class BatchPlayersDto {
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => parseInt(v, 10)) : value))
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}
