import { IsIn } from 'class-validator';

export class UpdateInviteStatusDto {
  @IsIn(['INVITED', 'CONFIRMED', 'DECLINED'])
  inviteStatus!: 'INVITED' | 'CONFIRMED' | 'DECLINED';
}
