import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurnatDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/updat-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurnats: Repository<Restaurant>,
  ) {}
  getAll(): Promise<Restaurant[]> {
    return this.restaurnats.find();
  }
  createRestaurant(
    createRestaurantDto: CreateRestaurnatDto,
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurnats.create(createRestaurantDto);
    return this.restaurnats.save(newRestaurant);
  }

  updateRestaurant({ id, data }: UpdateRestaurantDto) {
    return this.restaurnats.update(id, { ...data });
  }
}
