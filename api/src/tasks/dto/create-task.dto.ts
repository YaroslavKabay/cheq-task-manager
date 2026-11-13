import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const TITLE_MAX_LENGTH = 200;

export class CreateTaskDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(TITLE_MAX_LENGTH, {
    message: `title must be at most ${TITLE_MAX_LENGTH} characters`,
  })
  @IsNotEmpty({ message: 'title must not be empty' })
  @IsString({ message: 'title must be a non-empty string' })
  title!: string;
}
