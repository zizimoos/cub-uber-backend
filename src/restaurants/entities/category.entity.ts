import { Field, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  @Length(8, 12)
  name: string;

  @Field(() => String)
  @Column()
  @IsString()
  categoryImg: string;

  @Field(() => [Restaurant])
  @OneToMany(
    () => Restaurant,
    restaurant => restaurant.category,
  )
  restaurnats: Restaurant[];
}