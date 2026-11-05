import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitAttendanceDto {
  @ApiProperty({
    example: '- Developed employee dashboard.\n- Fixed authentication middleware.\n- Conducted API integration testing.',
    description: 'Mandatory daily work description describing tasks performed during WFH',
  })
  @IsString({ message: 'Deskripsi pekerjaan harus berupa teks' })
  @IsNotEmpty({ message: 'Deskripsi pekerjaan (work description) wajib diisi' })
  @Transform(({ value }) => value?.trim())
  workDescription: string;

  @ApiPropertyOptional({
    example: 'Completed planned sprint items.',
    description: 'Additional notes regarding the attendance submission',
  })
  @IsOptional()
  @IsString({ message: 'Catatan tambahan harus berupa teks' })
  @MaxLength(500, { message: 'Catatan tambahan maksimal 500 karakter' })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}

