import { Field, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  // @Field(() => Number)
  // @PrimaryGeneratedColumn()
  // @IsNumber()
  // id: number;

  @Field(() => String)
  @Column()
  @IsString()
  @Length(8, 12)
  name: string;

  @Field(() => String, { defaultValue: 'seoul' })
  @Column()
  @IsString()
  address: string;

  @Field(() => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(() => Category)
  @ManyToOne(
    () => Category,
    category => category.restaurnats,
  )
  category: Category;

  // @Field(() => Boolean, { nullable: true })
  // @Column({ default: true })
  // @IsOptional()
  // @IsBoolean()
  // isVegan: boolean;

  // @Field(() => String)
  // @Column()
  // @IsString()
  // ownerName: string;

  // @Field(() => String, { defaultValue: 'category' })
  // @Column({ default: true })
  // @IsString()
  // categoryName: string;
}
