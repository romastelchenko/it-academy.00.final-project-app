import {
  IsArray,
  IsIn,
  IsInt,
  Min,
  ValidateIf,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ResultLineDto {
  @IsInt()
  @Min(1)
  teamAId!: number;

  @IsInt()
  @Min(1)
  teamBId!: number;

  @IsInt()
  @Min(0)
  scoreA!: number;

  @IsInt()
  @Min(0)
  scoreB!: number;
}

export class CreateResultDto {
  @IsIn(['TWO_TEAMS', 'THREE_TEAMS'])
  format!: 'TWO_TEAMS' | 'THREE_TEAMS';

  @ValidateIf((o) => o.format === 'TWO_TEAMS')
  @IsInt()
  @Min(1)
  teamAId?: number;

  @ValidateIf((o) => o.format === 'TWO_TEAMS')
  @IsInt()
  @Min(1)
  teamBId?: number;

  @ValidateIf((o) => o.format === 'TWO_TEAMS')
  @IsInt()
  @Min(0)
  scoreA?: number;

  @ValidateIf((o) => o.format === 'TWO_TEAMS')
  @IsInt()
  @Min(0)
  scoreB?: number;

  @ValidateIf((o) => o.format === 'THREE_TEAMS')
  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ResultLineDto)
  lines?: ResultLineDto[];
}
