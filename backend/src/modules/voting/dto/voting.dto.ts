import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CastVoteDto {
  @ApiProperty({
    description: 'The candidate UUID (from our DB) the employee is voting for',
    example: 'a1b2c3d4-...',
  })
  @IsUUID()
  candidateId: string;

  @ApiPropertyOptional({
    description: 'Optional anonymous note / reason (not stored on-chain)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class PublishElectionDto {
  @ApiPropertyOptional({
    description: 'Optional cover image URL to store on-chain',
    example: 'https://cdn.insa.gov.et/elections/cover.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
