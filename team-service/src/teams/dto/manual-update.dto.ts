import { ArrayMinSize, IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MovePlayerDto {
  @IsInt()
  @Min(1)
  playerId!: number;

  @IsInt()
  @Min(1)
  fromTeamId!: number;

  @IsInt()
  @Min(1)
  toTeamId!: number;
}

export class TeamAssignmentDto {
  @IsInt()
  @Min(1)
  teamId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  playerIds!: number[];
}

export class ManualUpdateDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => MovePlayerDto)
  move?: MovePlayerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentDto)
  teams?: TeamAssignmentDto[];
}
